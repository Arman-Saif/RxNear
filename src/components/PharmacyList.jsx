import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { Phone, MapPin } from "lucide-react";

import MapView from "./MapView";
import { setCurrentPharmacy } from "../features/pharmacy/pharmacySlice";


function formatDistance(meters) {
  const value = Number(meters);

  if (!Number.isFinite(value)) {
    return "Information Unavailable";
  }

  if (value < 1000) {
    return `${Math.round(value)} m`;
  }

  return `${(value / 1000).toFixed(2)} km`;
}

function getPhoneHref(phone) {
  if (!phone) return null;

  const cleanedPhone = String(phone).replace(/[^\d+]/g, "");

  return cleanedPhone ? `tel:${cleanedPhone}` : null;
}

export default function PharmacyList() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { pharmacies, searchStatus, searchError, searchMeta } = useSelector(
    (state) => state.pharmacy,
  );

  const theme = useSelector((state) => state.app.theme);
  const isDark = theme === "dark";

  const origin = location.state?.origin || null;
  const searchQuery = location.state?.searchQuery || "";

  const [selectedPharmacy, setSelectedPharmacy] = useState(null);

  const pageClass = isDark
    ? "bg-[#101827] text-[#F8FAFC]"
    : "bg-[#EDF5F8] text-[#18364A]";

  const cardClass = isDark
    ? "border-[#33465C] bg-[#1B293B]"
    : "border-[#DCE5EC] bg-white";

  const mutedClass = isDark ? "text-[#A7B5C8]" : "text-[#718A9B]";

  const primaryButtonClass = isDark
    ? "bg-[#20C7C2] text-[#101827] hover:bg-[#35DCE0]"
    : "bg-[#087F9B] text-white hover:bg-[#066B82]";

  function selectPharmacy(pharmacy) {
    setSelectedPharmacy(pharmacy);
  }

  function handleCardKeyDown(event, pharmacy) {
    if (event.target !== event.currentTarget) return;

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectPharmacy(pharmacy);
    }
  }

  function openDetails(pharmacy) {
    dispatch(setCurrentPharmacy(pharmacy));

    navigate("/pharmacy-details", {
      state: {
        pharmacy,
        origin,
        searchQuery,
      },
    });
  }

  // Loading State
  if (searchStatus === "loading") {
    return (
      <main
        className={`flex min-h-screen flex-col transition-colors duration-300 ${pageClass}`}
      >
        <div className="flex flex-1 items-center justify-center px-5 py-16">
          <div
            className={`w-full max-w-md rounded-2xl border p-8 text-center shadow-sm ${cardClass}`}
          >
            <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-4 border-current border-t-transparent opacity-70" />

            <h1 className="text-xl font-bold">Pharmacy Results</h1>

            <p className={`mt-2 text-sm ${mutedClass}`} role="status">
              Searching for pharmacies...
            </p>
          </div>
        </div>
      </main>
    );
  }

  // Err State
  if (searchStatus === "failed") {
    return (
      <main
        className={`flex min-h-screen flex-col transition-colors duration-300 ${pageClass}`}
      >
        <div className="flex flex-1 items-center justify-center px-5 py-16">
          <div
            className={`w-full max-w-lg rounded-2xl border p-8 text-center shadow-sm ${cardClass}`}
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-red-500">
              <span className="text-2xl font-bold">!</span>
            </div>

            <h1 className="text-2xl font-bold">Unable to Find Pharmacies</h1>

            <p className={`mt-3 text-sm leading-6 ${mutedClass}`} role="alert">
              {searchError || "Unable to connect with the server"}
            </p>

            <button
              type="button"
              onClick={() => navigate("/finder")}
              className={`mt-6 rounded-xl px-6 py-3 text-sm font-semibold transition-colors ${primaryButtonClass}`}
            >
              Search Again
            </button>
          </div>
        </div>
      </main>
    );
  }

  // Empty State
  if (!pharmacies?.length) {
    return (
      <main
        className={`flex min-h-screen flex-col transition-colors duration-300 ${pageClass}`}
      >
        <div className="flex flex-1 items-center justify-center px-5 py-16">
          <div
            className={`w-full max-w-lg rounded-2xl border p-8 text-center shadow-sm ${cardClass}`}
          >
            <div
              className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl ${
                isDark ? "bg-[#243449]" : "bg-[#DDF1F5]"
              }`}
            >
              <MapPin
                size={32}
                className={isDark ? "text-[#20C7C2]" : "text-[#087F9B]"}
              />
            </div>

            <h1 className="text-2xl font-bold">
              {"No Pharmacies Found"}
            </h1>

            <p className={`mt-3 text-sm leading-6 ${mutedClass}`}>
              No pharmacies were found for this search or we failed to find any. Try another location.
            </p>

            <button
              type="button"
              onClick={() => navigate("/finder")}
              className={`mt-6 rounded-xl px-6 py-3 text-sm font-semibold transition-colors ${primaryButtonClass}`}
            >
              Search Another Location
            </button>
          </div>
        </div>
      </main>
    );
  }

  // pharmacy Resultes
  return (
    <main
      className={`min-h-screen transition-colors duration-300 ${pageClass}`}
    >
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* PAGE HEADER */}
        <header className="mb-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p
                className={`mb-2 text-xs font-bold uppercase tracking-[0.2em] ${
                  isDark ? "text-[#20C7C2]" : "text-[#087F9B]"
                }`}
              >
                RxNear Pharmacy Finder
              </p>

              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Pharmacy Results
              </h1>

              {searchQuery && (
                <p className={`mt-2 text-sm ${mutedClass}`}>
                  Search location: {searchQuery}
                </p>
              )}
            </div>

            <div
              className={`inline-flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium ${cardClass}`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  isDark ? "bg-[#20C7C2]" : "bg-[#087F9B]"
                }`}
              />
              {pharmacies.length} pharmacies found
            </div>
          </div>

          <div
            className={`mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm ${mutedClass}`}
          >
            <span>
              Search radius:{" "}
              {searchMeta?.searchRadius
                ? `${searchMeta.searchRadius / 1000} km`
                : "NULL"}
            </span>
          </div>

          {searchMeta?.partialResults && (
            <p
              role="status"
              className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
                isDark
                  ? "border-amber-400/30 bg-amber-400/10 text-amber-200"
                  : "border-amber-200 bg-amber-50 text-amber-800"
              }`}
            >
              {searchMeta.message || "Only a few pharmacies were found nearby."}
            </p>
          )}
        </header>

        {/* Map */}
        <section
          className={`mb-8 overflow-hidden rounded-2xl border p-2 shadow-sm ${cardClass}`}
        >
          <MapView
            pharmacies={pharmacies}
            selectedPharmacy={selectedPharmacy}
            center={origin}
            onSelectPharmacy={selectPharmacy}
          />
        </section>

        {/* Pharmacy Card */}
        <section>
          <div className="mb-5">
            <h2 className="text-xl font-bold">Nearby Pharmacies</h2>

            <p className={`mt-1 text-sm ${mutedClass}`}>
              Click anywhere on a pharmacy card to select it on the map.
            </p>
          </div>

          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {pharmacies.map((pharmacy) => {
              const isSelected = selectedPharmacy?.id === pharmacy.id;

              const phoneHref = getPhoneHref(pharmacy.phone);

              return (
                <li key={pharmacy.id}>
                  <article
                    tabIndex={0}
                    aria-label={`Select ${pharmacy.name} on map`}
                    aria-pressed={isSelected}
                    onClick={() => selectPharmacy(pharmacy)}
                    onKeyDown={(event) => handleCardKeyDown(event, pharmacy)}
                    className={[
                      "h-full cursor-pointer rounded-2xl border p-5",
                      "shadow-sm transition-all duration-200",
                      "focus:outline-none focus-visible:ring-2",
                      "focus-visible:ring-[#20C7C2]",
                      isSelected
                        ? isDark
                          ? "border-[#20C7C2] bg-[#243449] ring-1 ring-[#20C7C2]/40"
                          : "border-[#087F9B] bg-[#F7FCFD] ring-1 ring-[#087F9B]/20"
                        : `${cardClass} hover:-translate-y-0.5 hover:shadow-md`,
                    ].join(" ")}
                  >
                    {/* Pharmacy Name */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="break-words text-lg font-bold">
                          {pharmacy.name}
                        </h3>

                        <p className={`mt-1 text-sm leading-5 ${mutedClass}`}>
                          {pharmacy.address || "Information Unavailable"}
                        </p>
                      </div>

                      {isSelected && (
                        <span
                          className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                            isDark
                              ? "bg-[#20C7C2]/15 text-[#20C7C2]"
                              : "bg-[#DDF1F5] text-[#087F9B]"
                          }`}
                        >
                          Selected
                        </span>
                      )}
                    </div>

                    {/* Pharmacy INfo */}
                    <div
                      className={`mt-5 space-y-2 border-t pt-4 text-sm ${
                        isDark ? "border-[#33465C]" : "border-[#E5EDF2]"
                      }`}
                    >
                      <p className={mutedClass}>
                        <span className="font-semibold">Distance:</span>{" "}
                        {formatDistance(pharmacy.distance)}
                      </p>

                      <p className={mutedClass}>
                        <span className="font-semibold">Phone:</span>{" "}
                        {pharmacy.phone || "Information Unavailable"}
                      </p>
                    </div>

                    {/* Action Button */}
                    <div className="relative z-10 mt-5 flex flex-wrap gap-2">
                     
                      {phoneHref ? (
                        <a
                          href={phoneHref}
                          onClick={(event) => event.stopPropagation()}
                          aria-label={`Call ${pharmacy.name}`}
                          className={[
                            "flex flex-1 items-center justify-center gap-2",
                            "rounded-xl border px-4 py-2.5 text-sm font-semibold",
                            "transition-colors",
                            isDark
                              ? "border-[#20C7C2]/40 text-[#20C7C2] hover:bg-[#20C7C2]/10"
                              : "border-[#087F9B]/30 text-[#087F9B] hover:bg-[#DDF1F5]",
                          ].join(" ")}
                        >
                          <Phone size={16} />
                          Call Pharmacy
                        </a>
                      ) : (
                        <span
                          aria-disabled="true"
                          className={[
                            "flex flex-1 cursor-not-allowed items-center",
                            "justify-center gap-2 rounded-xl border px-4 py-2.5",
                            "text-sm font-semibold opacity-50",
                            isDark
                              ? "border-[#33465C] text-[#A7B5C8]"
                              : "border-[#DCE5EC] text-[#718A9B]",
                          ].join(" ")}
                        >
                          <Phone size={16} />
                          Call Unavailable
                        </span>
                      )}

                      {/* Detailed Info of Pharmacy */}
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          openDetails(pharmacy);
                        }}
                        className={[
                          "flex-1 rounded-xl px-4 py-2.5",
                          "text-sm font-semibold transition-colors",
                          primaryButtonClass,
                        ].join(" ")}
                      >
                        View Details
                      </button>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Search Again Button */}
        <div className="mt-10 flex justify-center">
          <button
            type="button"
            onClick={() => navigate("/finder")}
            className={`rounded-xl border px-6 py-3 text-sm font-semibold transition-colors ${
              isDark
                ? "border-[#33465C] bg-[#1B293B] text-[#F8FAFC] hover:bg-[#243449]"
                : "border-[#DCE5EC] bg-white text-[#18364A] hover:bg-[#F5FAFC]"
            }`}
          >
            Search Another Location
          </button>
        </div>
      </div>
    </main>
  );
}
