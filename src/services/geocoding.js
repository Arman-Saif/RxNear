import { GEOAPIFY_KEY, API_ENDPOINTS, SEARCH_CONFIG } from "../constants";

export class GeocodingError extends Error {
  constructor(message, code = "GEOCODING_ERROR") {
    super(message);
    this.name = "GeocodingError";
    this.code = code;
  }
}

function validateApiKey() {
  if (!GEOAPIFY_KEY) {
    throw new GeocodingError("Geoapify API key is missing.", "MISSING_API_KEY");
  }
}

function normalizeCountryCode(value) {
  if (typeof value !== "string") return null;

  const code = value.trim().toUpperCase();

  return /^[A-Z]{2}$/.test(code) ? code : null;
}

function mapLocationResult(result, fallbackLabel = "Unknown location") {
  const lat = Number(result?.lat);
  const lon = Number(result?.lon);

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lon) ||
    lat < -90 ||
    lat > 90 ||
    lon < -180 ||
    lon > 180
  ) {
    throw new GeocodingError(
      "The geocoding service returned invalid coordinates.",
      "INVALID_RESPONSE",
    );
  }

  return {
    label: result.formatted || fallbackLabel,
    lat,
    lon,
    country: result.country || null,
    countryCode: normalizeCountryCode(result.country_code),
  };
}

async function requestJson(url, signal) {
  try {
    const response = await fetch(url, {
      signal,
      headers: { Accept: "application/json" },
    });

    if (response.status === 401 || response.status === 403) {
      throw new GeocodingError(
        "The Geoapify API key is invalid or not authorized.",
        "UNAUTHORIZED",
      );
    }

    if (response.status === 429) {
      throw new GeocodingError(
        "Too many requests. Please try again later.",
        "RATE_LIMIT",
      );
    }

    if (!response.ok) {
      throw new GeocodingError(
        `Geocoding request failed (${response.status}).`,
        "HTTP_ERROR",
      );
    }

    return await response.json();
  } catch (error) {
    if (error.name === "AbortError") throw error;
    if (error instanceof GeocodingError) throw error;

    throw new GeocodingError(
      "Unable to connect to the geocoding service.",
      "NETWORK_ERROR",
    );
  }
}

export async function autocompleteLocations(query, signal) {
  validateApiKey();

  const value = String(query || "").trim();

  if (value.length < 3) return [];

  const params = new URLSearchParams({
    text: value,
    limit: String(SEARCH_CONFIG.SUGGESTION_LIMIT),
    format: "json",
    apiKey: GEOAPIFY_KEY,
  });

  const data = await requestJson(
    `${API_ENDPOINTS.AUTOCOMPLETE}?${params}`,
    signal,
  );

  return (data.results || [])
    .map((item) => {
      const location = mapLocationResult(item, value);

      return {
        id: item.place_id || `${location.lat}:${location.lon}`,
        ...location,
      };
    })
    .filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lon));
}

export async function reverseGeocode(lat, lon, signal) {
  validateApiKey();

  const latitude = Number(lat);
  const longitude = Number(lon);

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    throw new GeocodingError("Invalid coordinates.", "INVALID_COORDINATES");
  }

  const params = new URLSearchParams({
    lat: String(latitude),
    lon: String(longitude),
    format: "json",
    apiKey: GEOAPIFY_KEY,
  });

  const data = await requestJson(`${API_ENDPOINTS.REVERSE}?${params}`, signal);

  const result = data.results?.[0];

  if (!result) {
    throw new GeocodingError(
      "No address was found for this location.",
      "NOT_FOUND",
    );
  }

  return mapLocationResult(result, "Current location");
}

export async function geocodeAddress(query, signal) {
  validateApiKey();

  const value = String(query || "").trim();

  if (value.length < 3) {
    throw new GeocodingError(
      "Enter at least three characters for a location.",
      "INVALID_QUERY",
    );
  }

  const params = new URLSearchParams({
    text: value,
    limit: "1",
    format: "json",
    apiKey: GEOAPIFY_KEY,
  });

  const data = await requestJson(
    `${API_ENDPOINTS.GEOCODING}?${params}`,
    signal,
  );

  const result = data.results?.[0];

  if (!result) {
    throw new GeocodingError(
      "We couldn't find that location. Try another search.",
      "NOT_FOUND",
    );
  }

  return mapLocationResult(result, value);
}
