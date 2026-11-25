
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  ArrowLeft,
  MapPin,
  Phone,
  ShieldAlert,
  Siren,
  Ambulance,
  Flame,
  Search,
  ChevronDown,
  Globe2,
  LoaderCircle,
  Info,
  RefreshCw,
} from "lucide-react";

import useGeolocation from "../hooks/useGeolocation";
import { reverseGeocode } from "../services/geocoding";

import {
  getEmergencyContacts,
  getSupportedEmergencyCountries,
} from "../services/emergencyService";

const CONTACT_TYPES = [
  {
    key: "dispatch",
    label: "General Emergency",
    Icon: Siren,
  },
  {
    key: "police",
    label: "Police",
    Icon: ShieldAlert,
  },
  {
    key: "ambulance",
    label: "Ambulance",
    Icon: Ambulance,
  },
  {
    key: "fire",
    label: "Fire Service",
    Icon: Flame,
  },
];

function normalizeCoordinates(origin) {
  const lat = Number(origin?.lat);
  const lon = Number(origin?.lon ?? origin?.lng);

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lon) ||
    lat < -90 ||
    lat > 90 ||
    lon < -180 ||
    lon > 180
  ) {
    return null;
  }

  return { lat, lon };
}

function getPhoneHref(number) {
  return `tel:${String(number).replace(/[^\d+]/g, "")}`;
}

function getUniqueNumberCount(contacts = {}) {
  const uniqueNumbers = new Set();

  Object.values(contacts).forEach((value) => {
    if (!value) return;

    String(value)
      .split(" / ")
      .map((number) => number.trim())
      .filter(Boolean)
      .forEach((number) => uniqueNumbers.add(number));
  });

  return uniqueNumbers.size;
}

function EmergencyNumber({ number, isDark }) {
  if (!number) {
    return (
      <span className="text-xs text-slate-400">
        Not listed
      </span>
    );
  }

  const numbers = String(number).split(" / ");

  return (
    <div className="flex flex-wrap gap-2">
      {numbers.map((item) => (
        <a
          key={item}
          href={getPhoneHref(item)}
          className={[
            "inline-flex min-h-9 items-center gap-2 rounded-lg px-3 py-1.5",
            "text-sm font-bold transition-colors",
            "focus:outline-none focus-visible:ring-4 focus-visible:ring-[#20C7C2]/20",
            isDark
              ? "bg-[#20C7C2]/10 text-[#5DE5DE] hover:bg-[#20C7C2]/20"
              : "bg-[#087F9B]/10 text-[#087F9B] hover:bg-[#087F9B]/15",
          ].join(" ")}
        >
          <Phone size={13} />
          {item}
        </a>
      ))}
    </div>
  );
}

function CountryCard({
  country,
  isDark,
  expanded,
  onToggle,
  highlighted = false,
}) {
  const contacts = country.contacts || {};

  const numberCount =
    Number.isFinite(country.numberCount)
      ? country.numberCount
      : getUniqueNumberCount(contacts);

  return (
    <article
      className={[
        "overflow-hidden rounded-2xl border transition-colors duration-200",
        highlighted
          ? isDark
            ? "border-[#20C7C2]/50 bg-[#1B293B]"
            : "border-[#087F9B]/40 bg-white"
          : isDark
            ? "border-[#33465C] bg-[#1B293B]/80"
            : "border-[#DCE5EC] bg-white",
      ].join(" ")}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className={[
          "flex w-full items-center gap-3 p-4 text-left",
          "transition-colors",
          isDark
            ? "hover:bg-[#243449]/70"
            : "hover:bg-[#EDF5F8]/70",
        ].join(" ")}
      >
        <span
          className={[
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
            "text-sm font-extrabold",
            isDark
              ? "bg-[#243449] text-[#5DE5DE]"
              : "bg-[#DDF1F5] text-[#087F9B]",
          ].join(" ")}
        >
          {country.code}
        </span>

        <span className="min-w-0 flex-1">
          <span
            className={[
              "block truncate text-sm font-bold",
              isDark ? "text-[#F8FAFC]" : "text-[#18364A]",
            ].join(" ")}
          >
            {country.name}
          </span>

          <span
            className={[
              "mt-1 block text-xs",
              numberCount > 0
                ? isDark
                  ? "text-[#5DE5DE]"
                  : "text-[#087F9B]"
                : isDark
                  ? "text-[#A7B5C8]"
                  : "text-[#718A9B]",
            ].join(" ")}
          >
            {numberCount > 0
              ? `${numberCount} number${numberCount === 1 ? "" : "s"} available`
              : "No numbers"}
          </span>
        </span>

        {highlighted && (
          <span className="hidden rounded-full bg-[#20C7C2]/10 px-2.5 py-1 text-[10px] font-bold text-[#20C7C2] sm:inline-flex">
            YOUR COUNTRY
          </span>
        )}

        <ChevronDown
          size={18}
          className={[
            "shrink-0 transition-transform duration-200",
            isDark ? "text-[#A7B5C8]" : "text-[#718A9B]",
            expanded ? "rotate-180" : "",
          ].join(" ")}
        />
      </button>

      {expanded && (
        <div
          className={[
            "border-t px-4 pb-4 pt-3",
            isDark
              ? "border-[#33465C]"
              : "border-[#DCE5EC]",
          ].join(" ")}
        >
          {CONTACT_TYPES.map((service) => {
            const Icon = service.Icon;
            const number = contacts[service.key];

            return (
              <div
                key={service.key}
                className={[
                  "flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between",
                  "border-b last:border-b-0",
                  isDark
                    ? "border-[#33465C]/60"
                    : "border-[#DCE5EC]",
                ].join(" ")}
              >
                <span
                  className={[
                    "flex items-center gap-2 text-sm font-medium",
                    isDark
                      ? "text-[#A7B5C8]"
                      : "text-[#718A9B]",
                  ].join(" ")}
                >
                  <Icon size={16} />
                  {service.label}
                </span>

                <EmergencyNumber
                  number={number}
                  isDark={isDark}
                />
              </div>
            );
          })}
        </div>
      )}
    </article>
  );
}

export default function Emergency() {
  const navigate = useNavigate();
  const routeLocation = useLocation();

  const theme = useSelector((state) => state.app.theme);
  const isDark = theme === "dark";

  const {
    permission,
    loading: locationLoading,
    getCurrentLocation,
  } = useGeolocation();

  const searchedOrigin = routeLocation.state?.origin || null;

  const [countries, setCountries] = useState([]);
  const [detectedCountry, setDetectedCountry] = useState(null);
  const [search, setSearch] = useState("");
  const [expandedCountry, setExpandedCountry] = useState("");
  const [loadingCountry, setLoadingCountry] = useState(false);
  const [directoryLoading, setDirectoryLoading] = useState(true);
  const [error, setError] = useState("");
  const [locationMessage, setLocationMessage] = useState("");
  const [countryContacts, setCountryContacts] = useState({});

  // Load all countries and their number counts before expansion.
  const loadDirectory = useCallback(() => {
    setDirectoryLoading(true);
    setError("");

    try {
      const supported = getSupportedEmergencyCountries();

      if (!Array.isArray(supported) || supported.length === 0) {
        throw new Error("No supported countries were returned.");
      }

      const directory = supported.map((country) => {
        try {
          const result = getEmergencyContacts(country.code);

          return {
            ...country,
            contacts: result.contacts,
            numberCount: result.numberCount,
          };
        } catch {
          return {
            ...country,
            contacts: {},
            numberCount: 0,
          };
        }
      });

      setCountries(directory);

      setCountryContacts(
        Object.fromEntries(
          directory.map((country) => [
            country.code,
            country.contacts,
          ]),
        ),
      );
    } catch (directoryError) {
      setError(
        directoryError?.message ||
          "Unable to load the emergency directory.",
      );
    } finally {
      setDirectoryLoading(false);
    }
  }, []);

  const loadCountryContacts = useCallback(
    (countryCode) => {
      if (countryContacts[countryCode]) {
        return countryContacts[countryCode];
      }

      const result = getEmergencyContacts(countryCode);

      setCountryContacts((current) => ({
        ...current,
        [countryCode]: result.contacts,
      }));

      return result.contacts;
    },
    [countryContacts],
  );

  const identifyCountry = useCallback(async (origin) => {
    const coordinates = normalizeCoordinates(origin);

    if (!coordinates) {
      throw new Error("Valid location coordinates are unavailable.");
    }

    let details = origin;

    if (!details?.countryCode) {
      details = await reverseGeocode(
        coordinates.lat,
        coordinates.lon,
      );
    }

    const code = String(details?.countryCode || "")
      .trim()
      .toUpperCase();

    if (!/^[A-Z]{2}$/.test(code)) {
      throw new Error("Unable to identify your country.");
    }

    const contacts = getEmergencyContacts(code);

    const country = {
      code,
      name: details?.country || contacts.country,
      contacts: contacts.contacts,
      numberCount: contacts.numberCount,
    };

    setDetectedCountry(country);

    setCountryContacts((current) => ({
      ...current,
      [code]: contacts.contacts,
    }));

    setExpandedCountry(code);
    setLocationMessage(
      `Showing emergency numbers for ${country.name}.`,
    );
    setError("");

    return country;
  }, []);

  // Load the worldwide directory regardless of location permission.
  useEffect(() => {
    loadDirectory();
  }, [loadDirectory]);

  // Detect the user's country only when location permission is granted.
  useEffect(() => {
    if (permission === "checking") return;

    let cancelled = false;

    async function detect() {
      if (permission !== "granted") {
        setDetectedCountry(null);
        setLocationMessage(
          "Browse emergency numbers for countries around the world.",
        );
        return;
      }

      try {
        setLoadingCountry(true);
        setLocationMessage("Identifying your country...");

        const origin = searchedOrigin
          ? normalizeCoordinates(searchedOrigin)
          : await getCurrentLocation();

        if (!origin) {
          throw new Error("Unable to determine your location.");
        }

        const result = await identifyCountry(origin);

        if (cancelled) return;

        setDetectedCountry(result);
      } catch {
        if (cancelled) return;

        setDetectedCountry(null);
        setLocationMessage(
          "Your location could not be identified. You can still browse the full directory.",
        );
      } finally {
        if (!cancelled) {
          setLoadingCountry(false);
        }
      }
    }

    detect();

    return () => {
      cancelled = true;
    };
  }, [
    permission,
    searchedOrigin,
    getCurrentLocation,
    identifyCountry,
  ]);

  // Search by country name, code, service, or listed phone number.
  const displayedCountries = useMemo(() => {
    const term = search.trim().toLowerCase();

    const filtered = countries.filter((country) => {
      if (!term) return true;

      const cachedContacts =
        countryContacts[country.code] || {};

      const searchableNumbers = Object.values(cachedContacts)
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        country.name.toLowerCase().includes(term) ||
        country.code.toLowerCase().includes(term) ||
        searchableNumbers.includes(term) ||
        CONTACT_TYPES.some((service) =>
          service.label.toLowerCase().includes(term),
        )
      );
    });

    return [...filtered].sort((a, b) => {
      if (detectedCountry?.code === a.code) return -1;
      if (detectedCountry?.code === b.code) return 1;

      return a.name.localeCompare(b.name);
    });
  }, [
    countries,
    search,
    detectedCountry,
    countryContacts,
  ]);

  function toggleCountry(countryCode) {
    if (expandedCountry === countryCode) {
      setExpandedCountry("");
      return;
    }

    try {
      loadCountryContacts(countryCode);
      setExpandedCountry(countryCode);
      setError("");
    } catch (lookupError) {
      setError(
        lookupError?.message ||
          `Unable to load numbers for ${countryCode}.`,
      );
    }
  }

  async function handleUseCurrentLocation() {
    try {
      setError("");
      setLoadingCountry(true);
      setLocationMessage("Getting your current location...");

      const origin = await getCurrentLocation();
      await identifyCountry(origin);
    } catch (locationError) {
      setDetectedCountry(null);
      setLocationMessage(
        "Unable to identify your location. The worldwide directory is still available.",
      );
      setError(
        locationError?.message ||
          "Unable to retrieve your current location.",
      );
    } finally {
      setLoadingCountry(false);
    }
  }

  const cardClass = isDark
    ? "border-[#33465C] bg-[#1B293B]"
    : "border-[#DCE5EC] bg-white";

  const mutedText = isDark
    ? "text-[#A7B5C8]"
    : "text-[#718A9B]";

  return (
    <main
      className={[
        "mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8",
        isDark ? "text-[#F8FAFC]" : "text-[#18364A]",
      ].join(" ")}
    >
      <button
        type="button"
        onClick={() => navigate(-1)}
        className={[
          "mb-7 inline-flex items-center gap-2 rounded-xl px-3 py-2",
          "text-sm font-semibold transition-colors",
          isDark
            ? "text-[#A7B5C8] hover:bg-[#243449]"
            : "text-[#718A9B] hover:bg-[#DDF1F5]",
        ].join(" ")}
      >
        <ArrowLeft size={17} />
        Back
      </button>

      {/* Page heading */}
      <section
        className={[
          "rounded-[2rem] border p-6 shadow-sm backdrop-blur-xl sm:p-9",
          cardClass,
        ].join(" ")}
      >
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
            <Siren size={25} />
          </span>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-500">
              Emergency assistance
            </p>

            <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">
              Emergency Numbers
            </h1>
          </div>
        </div>

        <p className={`mt-5 max-w-3xl text-sm leading-7 ${mutedText}`}>
          Find emergency contact numbers for countries around the world.
          {detectedCountry
            ? ` Your detected country is ${detectedCountry.name}.`
            : " You can browse the directory without sharing your location."}
        </p>

        {/* Location status */}
        <div
          className={[
            "mt-6 flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between",
            isDark
              ? "border-[#33465C] bg-[#101827]/60"
              : "border-[#DCE5EC] bg-[#EDF5F8]/70",
          ].join(" ")}
        >
          <div className="flex items-start gap-3">
            <MapPin
              size={19}
              className="mt-0.5 shrink-0 text-[#20C7C2]"
            />

            <div>
              <p className="text-sm font-bold">
                {detectedCountry
                  ? detectedCountry.name
                  : "Country not detected"}
              </p>

              <p className={`mt-1 text-xs ${mutedText}`}>
                {locationMessage}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={locationLoading || loadingCountry}
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#087F9B] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#066B83] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {locationLoading || loadingCountry ? (
              <LoaderCircle size={17} className="animate-spin" />
            ) : (
              <RefreshCw size={16} />
            )}

            Detect Country
          </button>
        </div>
      </section>

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-500"
        >
          {error}
        </div>
      )}

      {/* Detected country */}
      {detectedCountry && (
        <section className="mt-9">
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#087F9B]">
              Based on your location
            </p>

            <h2 className="mt-1 text-xl font-extrabold">
              Emergency numbers near you
            </h2>
          </div>

          <CountryCard
            country={detectedCountry}
            isDark={isDark}
            expanded={true}
            highlighted={true}
            onToggle={() => setExpandedCountry("")}
          />
        </section>
      )}

      {/* Worldwide directory */}
      <section className="mt-10">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-[#087F9B]">
              <Globe2 size={18} />

              <p className="text-xs font-bold uppercase tracking-[0.16em]">
                Worldwide directory
              </p>
            </div>

            <h2 className="mt-2 text-2xl font-extrabold">
              Browse by country
            </h2>

            <p className={`mt-1 text-sm ${mutedText}`}>
              Search and expand a country to see its listed numbers.
            </p>
          </div>

          <span className={`text-xs ${mutedText}`}>
            {countries.length} supported countries
          </span>
        </div>

        {/* Search */}
        <div
          className={[
            "mb-5 flex min-h-14 items-center gap-3 rounded-2xl border px-4",
            "backdrop-blur-xl transition-colors focus-within:ring-4",
            isDark
              ? "border-[#33465C] bg-[#1B293B]/80 focus-within:border-[#20C7C2] focus-within:ring-[#20C7C2]/10"
              : "border-[#DCE5EC] bg-white/80 focus-within:border-[#087F9B] focus-within:ring-[#087F9B]/10",
          ].join(" ")}
        >
          <Search size={19} className={mutedText} />

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search country, service, or number..."
            aria-label="Search emergency directory"
            className={[
              "h-12 min-w-0 flex-1 bg-transparent text-sm outline-none",
              isDark
                ? "text-[#F8FAFC] placeholder:text-[#718A9B]"
                : "text-[#18364A] placeholder:text-[#9AAEBB]",
            ].join(" ")}
          />
        </div>

        {directoryLoading ? (
          <div
            role="status"
            className={`flex items-center justify-center gap-3 rounded-2xl border p-10 ${cardClass}`}
          >
            <LoaderCircle
              size={21}
              className="animate-spin text-[#20C7C2]"
            />

            <span className={`text-sm ${mutedText}`}>
              Loading country directory...
            </span>
          </div>
        ) : displayedCountries.length === 0 ? (
          <div
            className={`rounded-2xl border p-10 text-center ${cardClass}`}
          >
            <Globe2
              size={30}
              className={`mx-auto ${mutedText}`}
            />

            <h3 className="mt-3 font-bold">
              No countries found
            </h3>

            <p className={`mt-1 text-sm ${mutedText}`}>
              Try another country name or country code.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {displayedCountries.map((country) => {
              const contacts =
                countryContacts[country.code] ||
                country.contacts ||
                {};

              return (
                <CountryCard
                  key={country.code}
                  country={{
                    ...country,
                    contacts,
                    numberCount: country.numberCount,
                  }}
                  isDark={isDark}
                  expanded={expandedCountry === country.code}
                  highlighted={detectedCountry?.code === country.code}
                  onToggle={() => toggleCountry(country.code)}
                />
              );
            })}
          </div>
        )}
      </section>

      {/* Data disclaimer */}
      <aside
        className={[
          "mt-10 flex items-start gap-3 rounded-2xl border p-5",
          isDark
            ? "border-[#33465C] bg-[#1B293B]/70"
            : "border-[#DCE5EC] bg-[#DDF1F5]/70",
        ].join(" ")}
      >
        <Info
          size={19}
          className="mt-0.5 shrink-0 text-[#087F9B]"
        />

        <p className={`text-xs leading-6 ${mutedText}`}>
          Emergency numbers are provided by the installed
          emergency-numbers dataset and may not always be current or
          available in every region. The number count represents unique
          numbers listed in that dataset, not verified active services.
          Verify numbers with official local authorities when possible.
          If a number is not listed, this does not mean that the service
          does not exist.
        </p>
      </aside>
    </main>
  );
}
