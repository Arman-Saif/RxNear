import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  MapPin,
  Search,
  Navigation,
  LoaderCircle,
  MapPinned,
  X,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";

import useGeolocation from "../hooks/useGeolocation";
import { autocompleteLocations, reverseGeocode } from "../services/geocoding";

import { setPermissionModalOpen } from "../features/app/appSlice";

import LocationPermissionModal from "./LocationPermissionModal";
import IdleAnimation from "../animations/IdleAnimation";

const DEBOUNCE_DELAY = 500;
const MIN_QUERY_LENGTH = 3;

function HighlightedText({ text, query, isDark }) {
  const value = String(text || "");
  const index = value.toLowerCase().indexOf(query.trim().toLowerCase());

  if (!query.trim() || index === -1) return value;

  return (
    <>
      {value.slice(0, index)}
      <span
        className={
          isDark
            ? "rounded bg-[#20C7C2]/15 px-0.5 font-bold text-[#5DE5DE]"
            : "rounded bg-[#087F9B]/10 px-0.5 font-bold text-[#087F9B]"
        }
      >
        {value.slice(index, index + query.trim().length)}
      </span>
      {value.slice(index + query.trim().length)}
    </>
  );
}

export default function SearchBar({ onSearch, disabled = false }) {
  const dispatch = useDispatch();

  const theme = useSelector((state) => state.app.theme);
  const permission = useSelector((state) => state.app.locationPermission);
  const modalOpen = useSelector((state) => state.app.permissionModalOpen);

  const isDark = theme === "dark";

  const { loading, locationError, getCurrentLocation } = useGeolocation();

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selectedCoordinates, setSelectedCoordinates] = useState(null);
  const [suggestionError, setSuggestionError] = useState("");
  const [searchError, setSearchError] = useState("");
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);

  const autocompleteController = useRef(null);
  const debounceTimer = useRef(null);
  const locationController = useRef(null);
  const inputRef = useRef(null);

  const colors = isDark
    ? {
        text: "text-[#F8FAFC]",
        muted: "text-[#A7B5C8]",
        panel: "border-[#33465C]/80 bg-[#1B293B]/80",
        input: "bg-[#101827]/65 text-[#F8FAFC] placeholder:text-[#718A9B]",
        hover: "hover:bg-[#243449]/80",
        active: "bg-[#20C7C2]/10",
        divider: "border-[#33465C]/70",
        icon: "bg-[#20C7C2]/10 text-[#20C7C2]",
      }
    : {
        text: "text-[#18364A]",
        muted: "text-[#718A9B]",
        panel: "border-[#DCE5EC]/90 bg-white/80",
        input: "bg-white/65 text-[#18364A] placeholder:text-[#9AAEBB]",
        hover: "hover:bg-[#EDF5F8]/80",
        active: "bg-[#087F9B]/[0.07]",
        divider: "border-[#DCE5EC]",
        icon: "bg-[#087F9B]/10 text-[#087F9B]",
      };

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setSuggestionError("");
    setSuggestionLoading(false);
    setActiveSuggestion(-1);
    setSuggestionsOpen(false);
  }, []);

  // Autocomplete with 500 ms debounce.
  useEffect(() => {
    window.clearTimeout(debounceTimer.current);
    autocompleteController.current?.abort();

    const value = query.trim();

    if (value.length < MIN_QUERY_LENGTH || selectedCoordinates || disabled) {
      clearSuggestions();
      return;
    }

    const controller = new AbortController();
    autocompleteController.current = controller;

    setSuggestions([]);
    setSuggestionError("");
    setSuggestionLoading(false);
    setSuggestionsOpen(true);
    setActiveSuggestion(-1);

    debounceTimer.current = window.setTimeout(async () => {
      if (controller.signal.aborted) return;

      setSuggestionLoading(true);

      try {
        const results = await autocompleteLocations(value, controller.signal);

        if (
          !controller.signal.aborted &&
          autocompleteController.current === controller
        ) {
          setSuggestions(results);
          setSuggestionsOpen(true);
        }
      } catch (error) {
        if (
          error?.name !== "AbortError" &&
          !controller.signal.aborted &&
          autocompleteController.current === controller
        ) {
          setSuggestions([]);
          setSuggestionError(
            error?.message || "Unable to load location suggestions.",
          );
        }
      } finally {
        if (
          !controller.signal.aborted &&
          autocompleteController.current === controller
        ) {
          setSuggestionLoading(false);
        }
      }
    }, DEBOUNCE_DELAY);

    return () => {
      window.clearTimeout(debounceTimer.current);
      controller.abort();
    };
  }, [query, selectedCoordinates, disabled, clearSuggestions]);

  useEffect(() => {
    return () => {
      autocompleteController.current?.abort();
      locationController.current?.abort();
      window.clearTimeout(debounceTimer.current);
    };
  }, []);

  function handleInputChange(event) {
    setQuery(event.target.value);
    setSelectedCoordinates(null);
    setSearchError("");
    setActiveSuggestion(-1);
  }

  function handleSuggestionSelect(suggestion) {
    setQuery(suggestion.label);

    setSelectedCoordinates({
      lat: suggestion.lat,
      lon: suggestion.lon,
    });

    clearSuggestions();
    setSearchError("");
  }

  function handleInputKeyDown(event) {
    if (event.key === "Escape") {
      clearSuggestions();
      return;
    }

    if (!suggestionsOpen || suggestions.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveSuggestion((current) =>
        current >= suggestions.length - 1 ? 0 : current + 1,
      );
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveSuggestion((current) =>
        current <= 0 ? suggestions.length - 1 : current - 1,
      );
    }

    if (event.key === "Enter" && activeSuggestion >= 0) {
      event.preventDefault();
      handleSuggestionSelect(suggestions[activeSuggestion]);
    }
  }

  // Current location.
  const applyCurrentLocation = useCallback(async () => {
    locationController.current?.abort();

    const controller = new AbortController();
    locationController.current = controller;

    try {
      const coordinates = await getCurrentLocation();

      if (controller.signal.aborted) return;

      if (
        !coordinates ||
        !Number.isFinite(Number(coordinates.lat)) ||
        !Number.isFinite(Number(coordinates.lon))
      ) {
        throw new Error("Unable to determine your current coordinates.");
      }

      const address = await reverseGeocode(coordinates.lat, coordinates.lon);

      if (controller.signal.aborted) return;

      setQuery(address.label || "Current Location");

      setSelectedCoordinates({
        lat: coordinates.lat,
        lon: coordinates.lon,
      });

      clearSuggestions();
      setSearchError("");
    } finally {
      if (locationController.current === controller) {
        locationController.current = null;
      }
    }
  }, [getCurrentLocation, clearSuggestions]);

  async function handleGrantLocation() {
    setSearchError("");

    try {
      await applyCurrentLocation();
      dispatch(setPermissionModalOpen(false));
    } catch (error) {
      setSearchError(error?.message || "Unable to retrieve your location.");
    }
  }

  function handleRejectLocation() {
    dispatch(setPermissionModalOpen(false));
  }

  async function handleLocationButton() {
    setSearchError("");

    if (permission !== "granted") {
      dispatch(setPermissionModalOpen(true));
      return;
    }

    try {
      await applyCurrentLocation();
    } catch (error) {
      setSearchError(error?.message || "Unable to retrieve your location.");
    }
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (disabled || loading) return;

    setSearchError("");
    clearSuggestions();

    if (selectedCoordinates) {
      onSearch({
        query,
        coordinates: selectedCoordinates,
      });
      return;
    }

    const trimmedQuery = query.trim();

    if (trimmedQuery.length < MIN_QUERY_LENGTH) {
      setSearchError("Enter a location before searching.");
      return;
    }

    onSearch({
      query: trimmedQuery,
      coordinates: null,
    });
  }

  function clearInput() {
    setQuery("");
    setSelectedCoordinates(null);
    setSearchError("");
    clearSuggestions();
    inputRef.current?.focus();
  }

  const showSuggestionPanel =
    suggestionsOpen &&
    !selectedCoordinates &&
    query.trim().length >= MIN_QUERY_LENGTH &&
    !disabled;

  return (
    <section className="w-full space-y-5">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Search heading */}
        <div className="flex items-center justify-between gap-3">
          <label
            htmlFor="location-search"
            className={`text-sm font-bold ${colors.text}`}
          >
            Search for a location
          </label>

          <span
            className={[
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1",
              "text-[10px] font-bold uppercase tracking-wider",
              isDark
                ? "bg-[#20C7C2]/10 text-[#5DE5DE]"
                : "bg-[#087F9B]/10 text-[#087F9B]",
            ].join(" ")}
          >
            <Sparkles size={12} />
            Smart Search
          </span>
        </div>

        {/* Glassmorphism search field */}
        <div className="relative z-20">
          <div
            className={[
              "relative flex min-h-[66px] items-center gap-3 rounded-2xl",
              "border px-4 backdrop-blur-xl sm:px-5",
              "shadow-[0_8px_30px_rgba(15,40,60,0.06)]",
              "transition-all duration-200",
              "focus-within:ring-4",
              disabled ? "cursor-not-allowed opacity-60" : "",
              isDark
                ? "border-[#33465C] bg-[#1B293B]/75 focus-within:border-[#20C7C2] focus-within:ring-[#20C7C2]/10"
                : "border-[#DCE5EC] bg-white/75 focus-within:border-[#087F9B] focus-within:ring-[#087F9B]/10",
            ].join(" ")}
          >
            <div
              className={[
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                colors.icon,
              ].join(" ")}
            >
              <MapPin size={20} />
            </div>

            <input
              ref={inputRef}
              id="location-search"
              type="search"
              value={query}
              onChange={handleInputChange}
              onKeyDown={handleInputKeyDown}
              onFocus={() => {
                if (
                  query.trim().length >= MIN_QUERY_LENGTH &&
                  !selectedCoordinates
                ) {
                  setSuggestionsOpen(true);
                }
              }}
              placeholder="Search an area, road or address..."
              autoComplete="off"
              disabled={disabled}
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={showSuggestionPanel}
              aria-controls="location-suggestions"
              aria-activedescendant={
                activeSuggestion >= 0
                  ? `location-suggestion-${activeSuggestion}`
                  : undefined
              }
              className={[
                "h-12 min-w-0 flex-1 bg-transparent text-sm outline-none",
                colors.text,
                "[&::-webkit-search-cancel-button]:hidden",
                "[&::-webkit-search-decoration]:hidden",
                "[&::-webkit-search-results-button]:hidden",
                "[&::-webkit-search-results-decoration]:hidden",
              ].join(" ")}
            />

            {suggestionLoading && (
              <LoaderCircle
                size={19}
                className="shrink-0 animate-spin text-[#20C7C2]"
                aria-label="Loading suggestions"
              />
            )}

            {query && (
              <button
                type="button"
                onClick={clearInput}
                disabled={disabled}
                aria-label="Clear location"
                className={[
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                  colors.muted,
                  colors.hover,
                ].join(" ")}
              >
                <X size={17} />
              </button>
            )}
          </div>

          {/* Glass suggestion panel */}
          {showSuggestionPanel && (
            <div
              className={[
                "absolute left-0 right-0 top-full z-50 mt-3 overflow-hidden",
                "rounded-2xl border shadow-xl backdrop-blur-2xl",
                "animate-[rx-suggestion-in_180ms_ease-out]",
                colors.panel,
                isDark ? "shadow-black/30" : "shadow-[#18364A]/10",
              ].join(" ")}
            >
              <div
                className={[
                  "flex items-center justify-between border-b px-4 py-3",
                  colors.divider,
                ].join(" ")}
              >
                <div className="flex items-center gap-2">
                  <MapPinned size={15} className="text-[#20C7C2]" />
                  <span className={`text-xs font-bold ${colors.text}`}>
                    Location suggestions
                  </span>
                </div>

                <span className={`text-[10px] ${colors.muted}`}>
                  {suggestionLoading
                    ? "Searching..."
                    : `${suggestions.length} found`}
                </span>
              </div>

              {suggestionLoading && suggestions.length === 0 && (
                <div
                  role="status"
                  className={`flex items-center gap-3 px-4 py-5 text-sm ${colors.muted}`}
                >
                  <LoaderCircle
                    size={18}
                    className="animate-spin text-[#20C7C2]"
                  />
                  Finding matching locations...
                </div>
              )}

              {!suggestionLoading &&
                suggestions.length === 0 &&
                !suggestionError && (
                  <div className={`px-4 py-5 text-sm ${colors.muted}`}>
                    No matching locations found.
                  </div>
                )}

              {suggestions.length > 0 && (
                <ul
                  id="location-suggestions"
                  role="listbox"
                  aria-label="Location suggestions"
                  className="max-h-72 overflow-y-auto p-2"
                >
                  {suggestions.map((suggestion, index) => (
                    <li
                      key={suggestion.id}
                      id={`location-suggestion-${index}`}
                      role="option"
                      aria-selected={activeSuggestion === index}
                    >
                      <button
                        type="button"
                        disabled={disabled}
                        onMouseEnter={() => setActiveSuggestion(index)}
                        onClick={() => handleSuggestionSelect(suggestion)}
                        className={[
                          "group flex w-full items-center gap-3 rounded-xl",
                          "px-3 py-3 text-left transition-colors duration-150",
                          activeSuggestion === index
                            ? colors.active
                            : colors.hover,
                        ].join(" ")}
                      >
                        <span
                          className={[
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                            colors.icon,
                          ].join(" ")}
                        >
                          <MapPin size={18} />
                        </span>

                        <span className="min-w-0 flex-1">
                          <span
                            className={`block truncate text-sm font-semibold ${colors.text}`}
                          >
                            <HighlightedText
                              text={suggestion.label}
                              query={query}
                              isDark={isDark}
                            />
                          </span>

                          <span
                            className={`mt-1 block text-[11px] ${colors.muted}`}
                          >
                            Location result
                          </span>
                        </span>

                        <ArrowUpRight
                          size={16}
                          className={[
                            "shrink-0 transition-all",
                            activeSuggestion === index
                              ? "text-[#20C7C2] opacity-100"
                              : "opacity-0 group-hover:opacity-100",
                            colors.muted,
                          ].join(" ")}
                        />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {suggestionError && (
                <div
                  role="status"
                  className="border-t border-amber-500/20 bg-amber-500/10 px-4 py-3 text-xs text-amber-600"
                >
                  {suggestionError}
                </div>
              )}

              <div
                className={[
                  "flex items-center gap-2 border-t px-4 py-2.5",
                  colors.divider,
                ].join(" ")}
              >
                <span className={`text-[10px] ${colors.muted}`}>
                  ↑ ↓ Navigate · Enter Select · Esc Close
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Selected location */}
        {selectedCoordinates && (
          <div
            className={[
              "flex items-center gap-2 rounded-xl border px-3 py-2.5",
              "text-xs font-medium",
              isDark
                ? "border-[#20C7C2]/20 bg-[#20C7C2]/10 text-[#5DE5DE]"
                : "border-[#087F9B]/20 bg-[#087F9B]/5 text-[#087F9B]",
            ].join(" ")}
          >
            <MapPin size={15} />
            Selected location ready for search
          </div>
        )}

        {/* Action buttons */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={handleLocationButton}
            disabled={loading || disabled}
            className={[
              "group flex min-h-13 items-center justify-center gap-2.5",
              "rounded-xl border px-4 py-3 text-sm font-semibold",
              "backdrop-blur-xl transition-all duration-200",
              "hover:-translate-y-0.5 active:translate-y-0",
              "disabled:cursor-not-allowed disabled:opacity-50",
              isDark
                ? "border-[#33465C] bg-[#243449]/75 text-[#F8FAFC] hover:border-[#20C7C2]/50"
                : "border-[#DCE5EC] bg-white/75 text-[#18364A] hover:border-[#087F9B]/50",
            ].join(" ")}
          >
            {loading ? (
              <LoaderCircle size={18} className="animate-spin text-[#20C7C2]" />
            ) : (
              <Navigation size={18} className="text-[#20C7C2]" />
            )}

            {loading ? "Getting Location..." : "Use My Location"}
          </button>

          <button
            type="submit"
            disabled={disabled || loading}
            className={[
              "flex min-h-13 items-center justify-center gap-2.5",
              "rounded-xl bg-[#087F9B] px-4 py-3",
              "text-sm font-bold text-white shadow-lg shadow-[#087F9B]/15",
              "transition-all duration-200",
              "hover:-translate-y-0.5 hover:bg-[#066B83]",
              "active:translate-y-0",
              "disabled:cursor-not-allowed disabled:opacity-50",
            ].join(" ")}
          >
            <Search size={18} />
            Search Pharmacies
          </button>
        </div>
      </form>

      {/* Errors */}
      {locationError && (
        <p
          role="alert"
          className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-500"
        >
          {locationError}
        </p>
      )}

      {searchError && (
        <p
          role="alert"
          className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-500"
        >
          {searchError}
        </p>
      )}

      <IdleAnimation />

      <LocationPermissionModal
        open={modalOpen}
        permission={permission}
        loading={loading}
        error={locationError || searchError}
        onGrant={handleGrantLocation}
        onReject={handleRejectLocation}
      />

      <style>{`
        @keyframes rx-suggestion-in {
          from {
            opacity: 0;
            transform: translateY(-7px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-\\[rx-suggestion-in_180ms_ease-out\\] {
            animation: none !important;
          }
        }
      `}</style>
    </section>
  );
}
