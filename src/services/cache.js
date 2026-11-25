const CACHE_DURATION = 5 * 60 * 1000;
const pharmacyCache = new Map();

export function createLocationCacheKey(lat, lon) {
  const latitude = Number(lat).toFixed(3);
  const longitude = Number(lon).toFixed(3);

  return `${latitude}:${longitude}`;
}

export function getCachedPharmacies(key) {
  const cached = pharmacyCache.get(key);

  if (!cached) return null;

  if (Date.now() - cached.timestamp > CACHE_DURATION) {
    pharmacyCache.delete(key);
    return null;
  }

  return cached.data;
}

export function setCachedPharmacies(key, data) {
  pharmacyCache.set(key, {
    timestamp: Date.now(),
    data,
  });
}

export function clearPharmacyCache() {
  pharmacyCache.clear();
}
