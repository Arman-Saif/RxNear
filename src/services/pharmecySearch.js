import { GEOAPIFY_KEY, API_ENDPOINTS, SEARCH_CONFIG } from "../constants";

import {
  createLocationCacheKey,
  getCachedPharmacies,
  setCachedPharmacies,
} from "./cache";

export class PharmacySearchError extends Error {
  constructor(message, code = "PHARMACY_SEARCH_ERROR") {
    super(message);
    this.name = "PharmacySearchError";
    this.code = code;
  }
}

function validateCoordinates(coordinates) {
  const lat = Number(coordinates?.lat);
  const lon = Number(coordinates?.lon);

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lon) ||
    lat < -90 ||
    lat > 90 ||
    lon < -180 ||
    lon > 180
  ) {
    throw new PharmacySearchError(
      "A valid search location is required.",
      "INVALID_COORDINATES",
    );
  }

  return { lat, lon };
}

function getDistanceMeters(lat1, lon1, lat2, lon2) {
  const toRadians = (value) => (value * Math.PI) / 180;
  const earthRadius = 6371000;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return 2 * earthRadius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function normalizePharmacy(feature, origin) {
  const properties = feature?.properties || {};

  const lat = Number(properties.lat ?? feature?.geometry?.coordinates?.[1]);

  const lon = Number(properties.lon ?? feature?.geometry?.coordinates?.[0]);

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return null;
  }

  const addressParts = [
    properties.address_line1,
    properties.address_line2,
    properties.city,
    properties.state,
    properties.postcode,
    properties.country,
  ].filter(Boolean);

  const rawPhone =
    properties.contact?.phone ||
    properties.datasource?.raw?.phone ||
    properties.phone ||
    "";

  const rawWebsite =
    properties.website ||
    properties.contact?.website ||
    properties.datasource?.raw?.website ||
    "";

  const rawHours =
    properties.opening_hours || properties.datasource?.raw?.opening_hours || "";

  return {
    id: String(
      properties.place_id ||
        properties.datasource?.raw?.osm_id ||
        `${lat}:${lon}`,
    ),
    name: properties.name || "Unnamed Pharmacy",
    address:
      properties.formatted ||
      addressParts.join(", ") ||
      "Information Unavailable",
    lat,
    lon,
    phone: String(rawPhone || ""),
    website: String(rawWebsite || ""),
    openingHours: String(rawHours || ""),
    categories: properties.categories || [],
    distance: getDistanceMeters(origin.lat, origin.lon, lat, lon),
    properties,
  };
}

async function fetchRadius(origin, radius, signal) {
  const params = new URLSearchParams({
    categories: "commercial.health_and_beauty.pharmacy",
    filter: `circle:${origin.lon},${origin.lat},${radius}`,
    limit: String(SEARCH_CONFIG.MAX_RESULTS),
    apiKey: GEOAPIFY_KEY,
  });

  let response;

  try {
    response = await fetch(`${API_ENDPOINTS.PLACES}?${params}`, { signal });
  } catch (error) {
    if (error.name === "AbortError") throw error;

    throw new PharmacySearchError(
      "Unable to connect to the pharmacy search service.",
      "NETWORK_ERROR",
    );
  }

  if (response.status === 401 || response.status === 403) {
    throw new PharmacySearchError(
      "The Geoapify API key is invalid or unauthorized.",
      "UNAUTHORIZED",
    );
  }

  if (response.status === 429) {
    throw new PharmacySearchError(
      "The pharmacy service is receiving too many requests. Try again later.",
      "RATE_LIMIT",
    );
  }

  if (!response.ok) {
    throw new PharmacySearchError(
      `Pharmacy search failed (${response.status}).`,
      "HTTP_ERROR",
    );
  }

  let data;

  try {
    data = await response.json();
  } catch {
    throw new PharmacySearchError(
      "The pharmacy service returned invalid data.",
      "INVALID_RESPONSE",
    );
  }

  return (data.features || [])
    .map((feature) => normalizePharmacy(feature, origin))
    .filter(Boolean);
}

function deduplicate(pharmacies) {
  const unique = new Map();

  for (const pharmacy of pharmacies) {
    if (!unique.has(pharmacy.id)) {
      unique.set(pharmacy.id, pharmacy);
    }
  }

  return [...unique.values()].sort((a, b) => a.distance - b.distance);
}

export async function searchNearbyPharmacies(coordinates, options = {}) {
  if (!GEOAPIFY_KEY) {
    throw new PharmacySearchError(
      "Geoapify API key is missing.",
      "MISSING_API_KEY",
    );
  }

  const origin = validateCoordinates(coordinates);
  const { signal, useCache = true } = options;

  if (signal?.aborted) {
    throw new DOMException("Search cancelled.", "AbortError");
  }

  const cacheKey = createLocationCacheKey(origin.lat, origin.lon);

  if (useCache) {
    const cached = getCachedPharmacies(cacheKey);

    if (cached) {
      return {
        ...cached,
        fromCache: true,
      };
    }
  }

  const firstRadius = SEARCH_CONFIG.RADII[0];
  const secondRadius = SEARCH_CONFIG.RADII[1];

  let pharmacies = await fetchRadius(origin, firstRadius, signal);

  let usedRadius = firstRadius;
  let expandedSearch = false;

  if (pharmacies.length < SEARCH_CONFIG.MIN_RESULTS) {
    const expanded = await fetchRadius(origin, secondRadius, signal);

    pharmacies = deduplicate([...pharmacies, ...expanded]);

    usedRadius = secondRadius;
    expandedSearch = true;
  } else {
    pharmacies = deduplicate(pharmacies);
  }

  const partialResults =
    pharmacies.length > 0 && pharmacies.length < SEARCH_CONFIG.MIN_RESULTS;

  const searchMeta = {
    searchRadius: usedRadius,
    resultCount: pharmacies.length,
    expandedSearch,
    partialResults,
    message: partialResults ? "Only a few pharmacies were found nearby." : "",
  };

  const result = {
    pharmacies,
    searchMeta,
    fromCache: false,
  };

  if (useCache) {
    setCachedPharmacies(cacheKey, result);
  }

  return result;
}
