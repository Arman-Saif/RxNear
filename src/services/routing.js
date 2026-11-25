import { GEOAPIFY_KEY, API_ENDPOINTS } from "../constants";

export class RoutingError extends Error {
  constructor(message, code = "ROUTING_ERROR") {
    super(message);
    this.name = "RoutingError";
    this.code = code;
  }
}

const ROUTE_PREFERENCES = [
  { type: "balanced", label: "Balanced" },
  { type: "short", label: "Shortest" },
  { type: "less_maneuvers", label: "Fewer turns" },
];

const EARTH_RADIUS_METERS = 6371000;

function normalizePoint(point) {
  if (
    point?.lat === undefined ||
    point?.lon === undefined ||
    point?.lat === null ||
    point?.lon === null
  ) {
    throw new RoutingError(
      "A route starting point or destination is missing.",
      "INVALID_COORDINATES",
    );
  }

  const lat = Number(point.lat);
  const lon = Number(point.lon);

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lon) ||
    lat < -90 ||
    lat > 90 ||
    lon < -180 ||
    lon > 180
  ) {
    throw new RoutingError("Invalid route coordinates.", "INVALID_COORDINATES");
  }

  return { lat, lon };
}

function distanceBetween(a, b) {
  const toRadians = (value) => (value * Math.PI) / 180;

  const dLat = toRadians(b.lat - a.lat);
  const dLon = toRadians(b.lon - a.lon);

  const value =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(a.lat)) *
      Math.cos(toRadians(b.lat)) *
      Math.sin(dLon / 2) ** 2;

  return (
    EARTH_RADIUS_METERS * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value))
  );
}

function extractRouteCoordinates(geometry) {
  if (!geometry?.coordinates) return [];

  let lines = [];

  if (geometry.type === "LineString") {
    lines = [geometry.coordinates];
  } else if (geometry.type === "MultiLineString") {
    lines = geometry.coordinates;
  } else {
    return [];
  }

  return lines
    .flatMap((line) => (Array.isArray(line) ? line : []))
    .filter(
      (point) =>
        Array.isArray(point) &&
        point.length >= 2 &&
        Number.isFinite(Number(point[0])) &&
        Number.isFinite(Number(point[1])) &&
        Math.abs(Number(point[0])) <= 180 &&
        Math.abs(Number(point[1])) <= 90,
    )
    .map(([lon, lat]) => [Number(lat), Number(lon)]);
}

function getRouteSignature(coordinates) {
  if (!coordinates.length) return "";

  const sampleCount = Math.min(12, coordinates.length);
  const samples = [];

  for (let i = 0; i < sampleCount; i += 1) {
    const index =
      sampleCount === 1
        ? 0
        : Math.round((i * (coordinates.length - 1)) / (sampleCount - 1));

    const [lat, lon] = coordinates[index];
    samples.push(`${lat.toFixed(4)},${lon.toFixed(4)}`);
  }

  return samples.join("|");
}

async function requestRoute(origin, destination, preference, options) {
  const params = new URLSearchParams({
    waypoints: `${origin.lat},${origin.lon}|${destination.lat},${destination.lon}`,
    mode: options.mode || "drive",
    type: preference.type,
    format: "geojson",
    units: "metric",
    apiKey: GEOAPIFY_KEY,
  });

  let response;

  try {
    response = await fetch(`${API_ENDPOINTS.ROUTING}?${params}`, {
      signal: options.signal,
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;

    throw new RoutingError(
      "Unable to connect to the routing service.",
      "NETWORK_ERROR",
    );
  }

  if (response.status === 401 || response.status === 403) {
    throw new RoutingError(
      "The routing API key is invalid or unauthorized.",
      "UNAUTHORIZED",
    );
  }

  if (response.status === 429) {
    throw new RoutingError(
      "Too many route requests. Please try again later.",
      "RATE_LIMIT",
    );
  }

  if (!response.ok) {
    throw new RoutingError(
      `Route request failed (${response.status}).`,
      "HTTP_ERROR",
    );
  }

  let data;

  try {
    data = await response.json();
  } catch {
    throw new RoutingError(
      "The routing service returned invalid data.",
      "INVALID_RESPONSE",
    );
  }

  const feature = data.features?.[0];

  if (!feature) {
    throw new RoutingError(
      data.message || "No route was found.",
      "ROUTE_NOT_FOUND",
    );
  }

  const coordinates = extractRouteCoordinates(feature.geometry);

  if (coordinates.length < 2) {
    throw new RoutingError(
      "The routing service returned no usable route geometry.",
      "INVALID_GEOMETRY",
    );
  }

  const properties = feature.properties || {};
  const distanceMeters = Number(properties.distance);
  const durationSeconds = Number(properties.time);

  if (
    !Number.isFinite(distanceMeters) ||
    !Number.isFinite(durationSeconds) ||
    distanceMeters < 0 ||
    durationSeconds < 0
  ) {
    throw new RoutingError(
      "The route was found, but its distance or duration is missing.",
      "MISSING_ROUTE_SUMMARY",
    );
  }

  return {
    id: preference.type,
    type: preference.type,
    label: preference.label,
    coordinates,
    distanceMeters,
    durationSeconds,
    mode: options.mode || "drive",
  };
}

/**
 * Finds the nearest point on a route polyline to a GPS location.
 * Route coordinates are [latitude, longitude].
 */
export function calculateRouteProgress(route, location) {
  if (
    !route ||
    !Array.isArray(route.coordinates) ||
    route.coordinates.length < 2
  ) {
    return null;
  }

  const current = normalizePoint(location);
  const coordinates = route.coordinates;

  const latitudeScale = (Math.PI / 180) * EARTH_RADIUS_METERS;

  const longitudeScale =
    latitudeScale * Math.cos((current.lat * Math.PI) / 180);

  let totalGeometryDistance = 0;
  const segmentLengths = [];

  for (let i = 0; i < coordinates.length - 1; i += 1) {
    const a = { lat: coordinates[i][0], lon: coordinates[i][1] };
    const b = { lat: coordinates[i + 1][0], lon: coordinates[i + 1][1] };

    const length = distanceBetween(a, b);
    segmentLengths.push(length);
    totalGeometryDistance += length;
  }

  let bestDistance = Infinity;
  let bestProgress = 0;
  let distanceBeforeSegment = 0;

  for (let i = 0; i < coordinates.length - 1; i += 1) {
    const [lat1, lon1] = coordinates[i];
    const [lat2, lon2] = coordinates[i + 1];

    const ax = (lon1 - current.lon) * longitudeScale;
    const ay = (lat1 - current.lat) * latitudeScale;
    const bx = (lon2 - current.lon) * longitudeScale;
    const by = (lat2 - current.lat) * latitudeScale;

    const dx = bx - ax;
    const dy = by - ay;
    const lengthSquared = dx * dx + dy * dy;

    const rawT = lengthSquared === 0 ? 0 : -(ax * dx + ay * dy) / lengthSquared;

    const t = Math.max(0, Math.min(1, rawT));

    const projectedX = ax + t * dx;
    const projectedY = ay + t * dy;

    const distance = Math.sqrt(
      projectedX * projectedX + projectedY * projectedY,
    );

    if (distance < bestDistance) {
      bestDistance = distance;

      bestProgress = distanceBeforeSegment + segmentLengths[i] * t;
    }

    distanceBeforeSegment += segmentLengths[i];
  }

  const geometryRatio =
    totalGeometryDistance > 0
      ? Math.min(1, bestProgress / totalGeometryDistance)
      : 0;

  const originalDistance = Number(route.distanceMeters);
  const originalDuration = Number(route.durationSeconds);

  const remainingRatio = Math.max(0, 1 - geometryRatio);

  return {
    routeId: route.id,
    distanceToRouteMeters: bestDistance,
    progressRatio: geometryRatio,
    remainingDistanceMeters: Number.isFinite(originalDistance)
      ? originalDistance * remainingRatio
      : null,
    remainingDurationSeconds: Number.isFinite(originalDuration)
      ? originalDuration * remainingRatio
      : null,
  };
}

/**
 * Returns the route closest to the current GPS position.
 */
export function findBestMatchingRoute(routes, location, options = {}) {
  if (!Array.isArray(routes) || routes.length === 0) return null;

  const matches = routes
    .map((route) => {
      try {
        const progress = calculateRouteProgress(route, location);

        return progress ? { route, ...progress } : null;
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .sort((a, b) => a.distanceToRouteMeters - b.distanceToRouteMeters);

  if (!matches.length) return null;

  const best = matches[0];
  const accuracy = Number(options.accuracy);

  const allowedDistance = Math.min(
    100,
    Math.max(
      45,
      Number.isFinite(accuracy) && accuracy > 0 ? accuracy + 20 : 45,
    ),
  );

  if (best.distanceToRouteMeters > allowedDistance) {
    return {
      ...best,
      confident: false,
      reason: "TOO_FAR_FROM_ROUTE",
    };
  }

  const second = matches[1];

  const separation = second
    ? second.distanceToRouteMeters - best.distanceToRouteMeters
    : Infinity;

  const minimumSeparation = Math.max(
    12,
    Number.isFinite(accuracy) && accuracy > 0
      ? Math.min(accuracy * 0.5, 25)
      : 12,
  );

  return {
    ...best,
    confident: !second || separation >= minimumSeparation,
    reason:
      second && separation < minimumSeparation ? "ROUTES_TOO_CLOSE" : "MATCHED",
  };
}

export async function calculatePharmacyRoutes(
  origin,
  destination,
  options = {},
) {
  if (!GEOAPIFY_KEY) {
    throw new RoutingError("Geoapify API key is missing.", "MISSING_API_KEY");
  }

  const start = normalizePoint(origin);
  const end = normalizePoint(destination);
  const preferences = options.preferences || ROUTE_PREFERENCES;

  const results = await Promise.allSettled(
    preferences.map((preference) =>
      requestRoute(start, end, preference, options),
    ),
  );

  if (options.signal?.aborted) {
    throw new DOMException("Route request was cancelled.", "AbortError");
  }

  const routes = [];
  const errors = [];

  for (let index = 0; index < results.length; index += 1) {
    const result = results[index];

    if (result.status === "rejected") {
      if (result.reason?.name === "AbortError") {
        throw result.reason;
      }

      errors.push({
        type: preferences[index].type,
        message:
          result.reason?.message ||
          "This route preference could not be calculated.",
      });

      continue;
    }

    const route = result.value;
    const signature = getRouteSignature(route.coordinates);

    const duplicate = routes.some(
      (existing) => getRouteSignature(existing.coordinates) === signature,
    );

    if (!duplicate) routes.push(route);
  }

  if (routes.length === 0) {
    throw new RoutingError(
      errors[0]?.message || "No alternative routes could be calculated.",
      "NO_ROUTES_FOUND",
    );
  }

  routes.sort((a, b) => {
    if (a.type === "balanced") return -1;
    if (b.type === "balanced") return 1;
    return 0;
  });

  return { routes, errors };
}

export async function calculatePharmacyRoute(
  origin,
  destination,
  options = {},
) {
  const result = await calculatePharmacyRoutes(origin, destination, {
    ...options,
    preferences: [ROUTE_PREFERENCES[0]],
  });

  return result.routes[0];
}
