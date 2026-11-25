import {
  getEmergencyNumberByCountry,
  getSupportedCountries,
} from "emergency-numbers";

export class EmergencyServiceError extends Error {
  constructor(message, code = "EMERGENCY_SERVICE_ERROR") {
    super(message);
    this.name = "EmergencyServiceError";
    this.code = code;
  }
}

const COUNTRY_NAMES = new Intl.DisplayNames(["en"], {
  type: "region",
});

const SERVICE_LABELS = {
  police: "Police",
  ambulance: "Ambulance",
  fire: "Fire Service",
  dispatch: "General Emergency",
};

function normalizeCountryCode(countryCode) {
  if (typeof countryCode !== "string") return null;

  const code = countryCode.trim().toUpperCase();

  return /^[A-Z]{2}$/.test(code) ? code : null;
}

function collectNumbers(value, numbers = new Set()) {
  if (value === null || value === undefined) return numbers;

  if (Array.isArray(value)) {
    value.forEach((item) => collectNumbers(item, numbers));
    return numbers;
  }

  if (typeof value === "object") {
    Object.values(value).forEach((item) => collectNumbers(item, numbers));
    return numbers;
  }

  const number = String(value).trim();

  if (number) {
    numbers.add(number);
  }

  return numbers;
}

function normalizeNumber(value) {
  const numbers = [...collectNumbers(value)];

  return numbers.length ? numbers.join(" / ") : null;
}

function normalizeContacts(result) {
  return {
    police: normalizeNumber(result.police),
    ambulance: normalizeNumber(result.ambulance),
    fire: normalizeNumber(result.fire),
    dispatch: normalizeNumber(result.dispatch),
  };
}

function countUniqueNumbers(contacts) {
  const numbers = new Set();

  Object.values(contacts).forEach((value) => {
    if (!value) return;

    value.split(" / ").forEach((number) => {
      const normalized = number.trim();

      if (normalized) numbers.add(normalized);
    });
  });

  return numbers.size;
}

export function getSupportedEmergencyCountries() {
  try {
    const countryCodes = getSupportedCountries();

    if (!Array.isArray(countryCodes)) {
      throw new Error(
        "The emergency-number package returned invalid country data.",
      );
    }

    return countryCodes
      .map(normalizeCountryCode)
      .filter(Boolean)
      .map((code) => ({
        code,
        name: COUNTRY_NAMES.of(code) || code,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    throw new EmergencyServiceError(
      error?.message || "Unable to load the country directory.",
      "COUNTRY_DIRECTORY_ERROR",
    );
  }
}

export function getEmergencyContacts(countryCode) {
  const code = normalizeCountryCode(countryCode);

  if (!code) {
    throw new EmergencyServiceError(
      "A valid country code is required.",
      "INVALID_COUNTRY_CODE",
    );
  }

  try {
    const result = getEmergencyNumberByCountry(code);

    if (!result || typeof result !== "object") {
      throw new EmergencyServiceError(
        `Emergency numbers are unavailable for ${code}.`,
        "COUNTRY_NOT_SUPPORTED",
      );
    }

    const contacts = normalizeContacts(result);
    const numberCount = countUniqueNumbers(contacts);

    return {
      countryCode: code,
      country: COUNTRY_NAMES.of(code) || code,
      contacts,
      hasNumbers: numberCount > 0,
      numberCount,
      source: "emergency-numbers npm package",
    };
  } catch (error) {
    if (error instanceof EmergencyServiceError) {
      throw error;
    }

    throw new EmergencyServiceError(
      error?.message || `Unable to retrieve emergency numbers for ${code}.`,
      "COUNTRY_LOOKUP_ERROR",
    );
  }
}

export function getEmergencyServiceLabels() {
  return SERVICE_LABELS;
}
