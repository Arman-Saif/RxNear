export const GEOAPIFY_KEY = import.meta.env.VITE_GEOAPIFY_API_KEY;

export const API_ENDPOINTS = {
  AUTOCOMPLETE: "https://api.geoapify.com/v1/geocode/autocomplete",
  GEOCODING: "https://api.geoapify.com/v1/geocode/search",
  REVERSE: "https://api.geoapify.com/v1/geocode/reverse",
  PLACES: "https://api.geoapify.com/v2/places",
  ROUTING: "https://api.geoapify.com/v1/routing",
  TILES: "https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png",
};



export const SEARCH_CONFIG = {
  RADII: [2000, 4000],
  MIN_RESULTS: 4,
  MAX_RESULTS: 100,
  SUGGESTION_LIMIT: 5,
  SUGGESTION_DELAY: 600,
  SEARCH_TIMEOUT: 15000,
};

export const MAP_CONFIG = {
  DEFAULT_ZOOM: 13,
  DETAIL_ZOOM: 15,
  DEFAULT_CENTER: [23.8103, 90.4125],
};

export const GEOLOCATION_CONFIG = {
  ENABLE_HIGH_ACCURACY: true,
  TIMEOUT: 10000,
  MAXIMUM_AGE: 0,
};




