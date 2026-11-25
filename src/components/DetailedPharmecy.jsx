import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";

import {
  ArrowLeft,
  BadgeCheck,
  ChevronDown,
  ChevronUp,
  Clock3,
  Globe,
  Info,
  LoaderCircle,
  MapPin,
  Navigation,
  Phone,
  Route,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";

import MapView from "./MapView";
import useGeolocation from "../hooks/useGeolocation";

import {
  calculatePharmacyRoutes,
  calculateRouteProgress,
  findBestMatchingRoute,
} from "../services/routing";

function formatValue(value) {
  if (value === null || value === undefined || value === "") {
    return "Information Unavailable";
  }

  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.length ? value.join(", ") : "Information Unavailable";
  }

  return "Information Unavailable";
}

function formatDistance(meters) {
  const value = Number(meters);

  if (!Number.isFinite(value) || value < 0) {
    return "Information Unavailable";
  }

  return value >= 1000
    ? `${(value / 1000).toFixed(2)} km`
    : `${Math.round(value)} m`;
}

function formatDuration(seconds) {
  const value = Number(seconds);

  if (!Number.isFinite(value) || value < 0) {
    return "Information Unavailable";
  }

  const minutes = Math.round(value / 60);

  if (minutes < 60) {
    return `${minutes} minutes`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return remainingMinutes
    ? `${hours} hours ${remainingMinutes} minutes`
    : `${hours} hours`;
}

function safeWebsite(value) {
  if (!value) return null;

  try {
    const url = new URL(value);

    if (!["http:", "https:"].includes(url.protocol)) {
      return null;
    }

    return url.href;
  } catch {
    return null;
  }
}

function normalizeLocation(point) {
  if (
    !point ||
    point.lat === null ||
    point.lat === undefined ||
    point.lon === null ||
    point.lon === undefined
  ) {
    return null;
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
    return null;
  }

  return { lat, lon };
}

function InfoCard({ icon: Icon, label, children, isDark }) {
  return (
    <div
      className={[
        "flex items-start gap-3 rounded-xl border p-4",
        "transition-colors duration-200",
        isDark ? "border-[#33465C] bg-[#1B293B]" : "border-[#DCE5EC] bg-white",
      ].join(" ")}
    >
      <div
        className={[
          "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
          isDark
            ? "bg-[#243449] text-[#20C7C2]"
            : "bg-[#DDF1F5] text-[#087F9B]",
        ].join(" ")}
      >
        <Icon size={19} />
      </div>

      <div className="min-w-0 flex-1">
        <p
          className={[
            "text-xs font-medium uppercase tracking-wider",
            isDark ? "text-[#A7B5C8]" : "text-[#718A9B]",
          ].join(" ")}
        >
          {label}
        </p>

        <div
          className={[
            "mt-1 break-words text-sm font-medium",
            isDark ? "text-[#F8FAFC]" : "text-[#18364A]",
          ].join(" ")}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export default function DetailedPharmacy() {
  const navigate = useNavigate();
  const location = useLocation();

  const isDark = useSelector((state) => state.app.theme) === "dark";

  const pharmacyFromState = location.state?.pharmacy;
  const manualOrigin = location.state?.origin || null;

  const pharmacyFromRedux = useSelector(
    (state) => state.pharmacy.currentPharmacy,
  );

  const pharmacy = pharmacyFromState || pharmacyFromRedux;

  const { permission } = useGeolocation();

  const [routeOrigin, setRouteOrigin] = useState(manualOrigin);
  const [routeRequestOrigin, setRouteRequestOrigin] = useState(manualOrigin);

  const [currentLocation, setCurrentLocation] = useState(null);
  const [routeProgress, setRouteProgress] = useState(null);

  const [routes, setRoutes] = useState([]);
  const [selectedRouteId, setSelectedRouteId] = useState(null);

  const [routeStatus, setRouteStatus] = useState("idle");
  const [routeError, setRouteError] = useState("");
  const [routeNotice, setRouteNotice] = useState("");

  const [routesExpanded, setRoutesExpanded] = useState(false);

  const latestPositionRef = useRef(null);
  const lastAppliedTimestampRef = useRef(0);
  const initialRouteRequestRef = useRef(false);

  const matchCandidateRef = useRef({
    routeId: null,
    count: 0,
  });

  const pharmacyLat = Number(pharmacy?.lat);
  const pharmacyLon = Number(pharmacy?.lon);

  const pharmacyCoordinatesValid =
    pharmacy?.lat !== null &&
    pharmacy?.lat !== undefined &&
    pharmacy?.lon !== null &&
    pharmacy?.lon !== undefined &&
    Number.isFinite(pharmacyLat) &&
    Number.isFinite(pharmacyLon) &&
    pharmacyLat >= -90 &&
    pharmacyLat <= 90 &&
    pharmacyLon >= -180 &&
    pharmacyLon <= 180;

 

  useEffect(() => {
    if (!pharmacy) return;

    latestPositionRef.current = null;
    lastAppliedTimestampRef.current = 0;
    initialRouteRequestRef.current = false;

    matchCandidateRef.current = {
      routeId: null,
      count: 0,
    };

    if (permission !== "granted") {
      setCurrentLocation(null);
      setRouteOrigin(manualOrigin);
      setRouteRequestOrigin(manualOrigin);
      return;
    }

    if (!navigator.geolocation) {
      setCurrentLocation(null);
      setRouteOrigin(manualOrigin);
      setRouteRequestOrigin(manualOrigin);
      return;
    }

    setCurrentLocation(null);
    setRouteOrigin(null);
    setRouteRequestOrigin(null);

    function applyLatestPosition() {
      const latest = latestPositionRef.current;

      if (!latest) return;

      if (latest.timestamp <= lastAppliedTimestampRef.current) {
        return;
      }

      lastAppliedTimestampRef.current = latest.timestamp;

      const nextOrigin = {
        lat: latest.lat,
        lon: latest.lon,
        accuracy: latest.accuracy,
      };

      setCurrentLocation(nextOrigin);
      setRouteOrigin(nextOrigin);

      if (!initialRouteRequestRef.current) {
        initialRouteRequestRef.current = true;
        setRouteRequestOrigin(nextOrigin);
      }
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const lat = Number(position.coords.latitude);
        const lon = Number(position.coords.longitude);
        const accuracy = Number(position.coords.accuracy);

        if (
          !Number.isFinite(lat) ||
          !Number.isFinite(lon) ||
          lat < -90 ||
          lat > 90 ||
          lon < -180 ||
          lon > 180
        ) {
          return;
        }

        if (Number.isFinite(accuracy) && accuracy > 100) {
          return;
        }

        latestPositionRef.current = {
          lat,
          lon,
          accuracy: Number.isFinite(accuracy) ? accuracy : null,
          timestamp: position.timestamp || Date.now(),
        };

        if (!initialRouteRequestRef.current) {
          applyLatestPosition();
        }
      },
      () => {
        if (!initialRouteRequestRef.current && manualOrigin) {
          setRouteOrigin(manualOrigin);
          setRouteRequestOrigin(manualOrigin);
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 15000,
      },
    );

    const intervalId = window.setInterval(applyLatestPosition, 20000);

    return () => {
      navigator.geolocation.clearWatch(watchId);
      window.clearInterval(intervalId);
    };
  }, [pharmacy?.id, permission, manualOrigin?.lat, manualOrigin?.lon]);

 

  useEffect(() => {
    const normalizedOrigin = normalizeLocation(routeRequestOrigin);

    if (!normalizedOrigin || !pharmacyCoordinatesValid) {
      setRoutes([]);
      setSelectedRouteId(null);
      setRouteProgress(null);
      setRouteStatus("idle");
      setRouteError("");
      setRouteNotice("");
      return;
    }

    const destination = {
      lat: pharmacyLat,
      lon: pharmacyLon,
    };

    const controller = new AbortController();

    setRouteStatus("loading");
    setRouteError("");
    setRouteNotice("");
    setRoutes([]);
    setSelectedRouteId(null);
    setRouteProgress(null);

    async function loadRoutes() {
      try {
        const result = await calculatePharmacyRoutes(
          normalizedOrigin,
          destination,
          {
            mode: "drive",
            signal: controller.signal,
          },
        );

        if (controller.signal.aborted) return;

        const availableRoutes = Array.isArray(result.routes)
          ? result.routes
          : [];

        setRoutes(availableRoutes);

        const initialRoute =
          availableRoutes.find((route) => route.type === "balanced") ||
          availableRoutes[0];

        if (initialRoute) {
          setSelectedRouteId(initialRoute.id);
          setRouteStatus("succeeded");

          if (availableRoutes.length === 1) {
            setRouteNotice(
              "Only one distinct route was available for these locations.",
            );
          } else if (result.errors?.length > 0) {
            setRouteNotice(
              "Some route preferences could not be calculated. Showing the available routes.",
            );
          }
        } else {
          setRouteStatus("failed");
          setRouteError("No route alternatives were returned.");
        }
      } catch (error) {
        if (controller.signal.aborted || error.name === "AbortError") {
          return;
        }

        setRoutes([]);
        setSelectedRouteId(null);
        setRouteStatus("failed");
        setRouteError(error.message || "Unable to calculate routes.");
      }
    }

    loadRoutes();

    return () => {
      controller.abort();
    };
  }, [
    routeRequestOrigin?.lat,
    routeRequestOrigin?.lon,
    pharmacyLat,
    pharmacyLon,
    pharmacyCoordinatesValid,
  ]);

 

  useEffect(() => {
    if (!currentLocation || routes.length === 0) {
      setRouteProgress(null);
      return;
    }

    const match = findBestMatchingRoute(routes, currentLocation, {
      accuracy: currentLocation.accuracy,
    });

    if (!match || !match.confident) {
      matchCandidateRef.current = {
        routeId: null,
        count: 0,
      };

      const activeRoute = routes.find((route) => route.id === selectedRouteId);

      setRouteProgress(
        activeRoute
          ? calculateRouteProgress(activeRoute, currentLocation)
          : null,
      );

      return;
    }

    const activeRoute = routes.find((route) => route.id === selectedRouteId);

    if (activeRoute?.id === match.route.id) {
      matchCandidateRef.current = {
        routeId: null,
        count: 0,
      };
    } else {
      if (matchCandidateRef.current.routeId === match.route.id) {
        matchCandidateRef.current.count += 1;
      } else {
        matchCandidateRef.current = {
          routeId: match.route.id,
          count: 1,
        };
      }

      if (matchCandidateRef.current.count >= 3) {
        setSelectedRouteId(match.route.id);

        matchCandidateRef.current = {
          routeId: null,
          count: 0,
        };
      }
    }

    const progressRoute =
      routes.find((route) => route.id === selectedRouteId) ||
      routes.find((route) => route.id === match.route.id);

    setRouteProgress(
      progressRoute
        ? calculateRouteProgress(progressRoute, currentLocation)
        : null,
    );
  }, [currentLocation, routes, selectedRouteId]);

 

  if (!pharmacy) {
    return (
      <main
        className={[
          "flex min-h-[70vh] items-center justify-center p-5",
          isDark ? "text-[#F8FAFC]" : "text-[#18364A]",
        ].join(" ")}
      >
        <div
          className={[
            "w-full max-w-md rounded-2xl border p-8 text-center shadow-lg",
            isDark
              ? "border-[#33465C] bg-[#1B293B]"
              : "border-[#DCE5EC] bg-white",
          ].join(" ")}
        >
          <div
            className={[
              "mx-auto flex h-16 w-16 items-center justify-center rounded-2xl",
              isDark
                ? "bg-[#243449] text-[#20C7C2]"
                : "bg-[#DDF1F5] text-[#087F9B]",
            ].join(" ")}
          >
            <MapPin size={30} />
          </div>

          <h1 className="mt-5 text-xl font-bold">Pharmacy Not Found</h1>

          <p
            className={[
              "mt-2 text-sm",
              isDark ? "text-[#A7B5C8]" : "text-[#718A9B]",
            ].join(" ")}
          >
            Select a pharmacy from the search results first.
          </p>

          <button
            type="button"
            onClick={() => navigate("/finder")}
            className={[
              "mt-6 inline-flex items-center justify-center gap-2",
              "rounded-xl px-5 py-3 text-sm font-semibold",
              "transition-all duration-200 hover:-translate-y-0.5",
              isDark
                ? "bg-[#20C7C2] text-[#101827] hover:bg-[#3ADBD5]"
                : "bg-[#087F9B] text-white hover:bg-[#066A82]",
            ].join(" ")}
          >
            <Navigation size={17} />
            Search Pharmacies
          </button>
        </div>
      </main>
    );
  }

  const properties = pharmacy.properties || {};
  const raw = properties.datasource?.raw || {};

  const licence =
    raw.licence || raw.license || properties.licence || properties.license;

  const website = safeWebsite(pharmacy.website);

  const selectedRoute =
    routes.find((route) => route.id === selectedRouteId) || null;

  const selectedRouteProgress =
    routeProgress?.routeId === selectedRouteId ? routeProgress : null;

  const surfaceClass = isDark
    ? "border-[#33465C] bg-[#1B293B]"
    : "border-[#DCE5EC] bg-white";

  const headingText = isDark ? "text-[#F8FAFC]" : "text-[#18364A]";

  const secondaryText = isDark ? "text-[#A7B5C8]" : "text-[#718A9B]";

  const accentText = isDark ? "text-[#20C7C2]" : "text-[#087F9B]";

  const accentButton = isDark
    ? "bg-[#20C7C2] text-[#101827] hover:bg-[#3ADBD5]"
    : "bg-[#087F9B] text-white hover:bg-[#066A82]";

  return (
    <main
      className={[
        "min-h-screen pb-28 transition-colors duration-200",
        isDark ? "text-[#F8FAFC]" : "text-[#18364A]",
      ].join(" ")}
    >
    

      <header className="mx-auto w-full max-w-7xl space-y-4 px-4 py-6 sm:px-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className={[
            "inline-flex items-center gap-2 rounded-xl px-3 py-2",
            "text-sm font-semibold transition-colors",
            isDark
              ? "text-[#A7B5C8] hover:bg-[#243449] hover:text-[#F8FAFC]"
              : "text-[#718A9B] hover:bg-[#DDF1F5] hover:text-[#18364A]",
          ].join(" ")}
        >
          <ArrowLeft size={18} />
          Back to Results
        </button>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="break-words text-2xl font-bold tracking-tight sm:text-3xl">
                {formatValue(pharmacy.name)}
              </h1>

              <span
                className={[
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-1",
                  "text-xs font-semibold",
                  isDark
                    ? "bg-[#243449] text-[#20C7C2]"
                    : "bg-[#DDF1F5] text-[#087F9B]",
                ].join(" ")}
              >
                <ShieldCheck size={13} />
                Pharmacy
              </span>
            </div>

            <p
              className={[
                "mt-2 flex items-start gap-2 text-sm",
                secondaryText,
              ].join(" ")}
            >
              <MapPin size={17} className="mt-0.5 shrink-0" />
              {formatValue(pharmacy.address)}
            </p>
          </div>
        </div>
      </header>

      {/* Map */}

      <section
        aria-label="Pharmacy map"
        className="mx-auto w-full max-w-7xl px-4 sm:px-6"
      >
        <div
          className={[
            "overflow-hidden rounded-2xl border shadow-sm",
            surfaceClass,
          ].join(" ")}
        >
          <div
            className={[
              "flex items-center gap-2 border-b px-4 py-3",
              isDark ? "border-[#33465C]" : "border-[#DCE5EC]",
            ].join(" ")}
          >
            <MapPin size={18} className={accentText} />

            <h2 className="text-sm font-semibold">Pharmacy Location</h2>
          </div>

          <MapView
            pharmacies={[pharmacy]}
            selectedPharmacy={pharmacy}
            center={routeOrigin}
            currentLocation={currentLocation}
            followUser={Boolean(currentLocation)}
            zoom={15}
            routeAlternatives={routes}
            selectedRouteId={selectedRouteId}
          />
        </div>
      </section>

      {/* PHARMACY INFORMATION */}

      <section className="mx-auto w-full max-w-7xl space-y-4 px-4 py-7 sm:px-6">
        <div>
          <h2 className="text-xl font-bold">Pharmacy Information</h2>

          <p className={`mt-1 text-sm ${secondaryText}`}>
            Contact details and available pharmacy information.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <InfoCard icon={Phone} label="Phone Number" isDark={isDark}>
            {pharmacy.phone ? (
              <a
                href={`tel:${pharmacy.phone.replace(/[^\d+]/g, "")}`}
                className={`${accentText} transition-opacity hover:opacity-75`}
              >
                {pharmacy.phone}
              </a>
            ) : (
              "Information Unavailable"
            )}
          </InfoCard>

          <InfoCard icon={Globe} label="Website" isDark={isDark}>
            {website ? (
              <a
                href={website}
                target="_blank"
                rel="noopener noreferrer"
                className={`${accentText} break-all transition-opacity hover:opacity-75`}
              >
                Visit Website
              </a>
            ) : (
              "Information Unavailable"
            )}
          </InfoCard>

          <InfoCard icon={Clock3} label="Opening Hours" isDark={isDark}>
            {formatValue(pharmacy.openingHours)}
          </InfoCard>

          <InfoCard icon={BadgeCheck} label="Licence" isDark={isDark}>
            {formatValue(licence)}
          </InfoCard>

          <InfoCard icon={MapPin} label="Latitude" isDark={isDark}>
            {formatValue(pharmacy.lat)}
          </InfoCard>

          <InfoCard icon={Navigation} label="Longitude" isDark={isDark}>
            {formatValue(pharmacy.lon)}
          </InfoCard>
        </div>
      </section>

      {/* Route Dwarer */}

      <section
        aria-label="Route options"
        className="fixed inset-x-0 bottom-0 z-[1000]"
      >
        <div
          id="route-drawer-content"
          aria-hidden={!routesExpanded}
          inert={!routesExpanded}
          className={[
            "overflow-y-auto shadow-[0_-8px_30px_rgba(0,0,0,0.15)]",
            "transition-all duration-300 ease-in-out",
            isDark ? "bg-[#1B293B]" : "bg-white",
            routesExpanded
              ? [
                  "max-h-[60vh] border-t opacity-100",
                  isDark ? "border-[#33465C]" : "border-[#DCE5EC]",
                ].join(" ")
              : "max-h-0 border-t-0 opacity-0",
          ].join(" ")}
        >
          <div className="mx-auto max-w-5xl space-y-4 p-4 sm:p-5">
            {/* Route header */}

            <div>
              <div className="flex items-center gap-2">
                <div
                  className={[
                    "flex h-10 w-10 items-center justify-center rounded-xl",
                    isDark
                      ? "bg-[#243449] text-[#20C7C2]"
                      : "bg-[#DDF1F5] text-[#087F9B]",
                  ].join(" ")}
                >
                  <Route size={20} />
                </div>

                <div>
                  <h2 className="text-lg font-bold">Route to Pharmacy</h2>

                  <p className={`text-xs ${secondaryText}`}>
                    Available travel routes
                  </p>
                </div>
              </div>

              {permission === "granted" ? (
                <p className={`mt-3 text-sm ${secondaryText}`}>
                  Using your current location when available.
                </p>
              ) : (
                <p className={`mt-3 text-sm ${secondaryText}`}>
                  Using the location you searched for as the route starting
                  point.
                </p>
              )}

              {currentLocation && (
                <p className={`mt-1 text-xs ${secondaryText}`}>
                  GPS accuracy:{" "}
                  {currentLocation.accuracy !== null
                    ? `${Math.round(currentLocation.accuracy)} m`
                    : "Unavailable"}
                </p>
              )}
            </div>

            {/* Loading Section */}

            {routeStatus === "loading" && (
              <div
                role="status"
                className={[
                  "flex items-center gap-3 rounded-xl border p-4",
                  surfaceClass,
                ].join(" ")}
              >
                <LoaderCircle
                  size={22}
                  className={`${accentText} animate-spin`}
                />

                <div>
                  <p className="text-sm font-semibold">Calculating routes</p>

                  <p className={`text-xs ${secondaryText}`}>
                    Finding available routes to this pharmacy...
                  </p>
                </div>
              </div>
            )}

            {/* Error section */}

            {routeStatus === "failed" && (
              <div
                role="alert"
                className={[
                  "flex items-start gap-3 rounded-xl border p-4",
                  isDark
                    ? "border-red-400/30 bg-red-950/30 text-red-300"
                    : "border-red-200 bg-red-50 text-red-700",
                ].join(" ")}
              >
                <AlertCircle size={20} className="mt-0.5 shrink-0" />

                <div>
                  <p className="text-sm font-semibold">
                    Unable to calculate routes
                  </p>

                  <p className="mt-1 text-sm">
                    {routeError || "Unable to calculate routes."}
                  </p>
                </div>
              </div>
            )}

            {/* Success section */}

            {routeStatus === "succeeded" && (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold">
                    Available Routes ({routes.length})
                  </h3>

                  <span
                    className={[
                      "rounded-full px-3 py-1 text-xs font-semibold",
                      isDark
                        ? "bg-[#243449] text-[#20C7C2]"
                        : "bg-[#DDF1F5] text-[#087F9B]",
                    ].join(" ")}
                  >
                    {routes.length} found
                  </span>
                </div>

                {routeNotice && (
                  <div
                    role="status"
                    className={[
                      "flex items-start gap-2 rounded-xl border p-3 text-sm",
                      isDark
                        ? "border-amber-400/20 bg-amber-950/30 text-amber-300"
                        : "border-amber-200 bg-amber-50 text-amber-800",
                    ].join(" ")}
                  >
                    <Info size={17} className="mt-0.5 shrink-0" />

                    {routeNotice}
                  </div>
                )}

                {/* Selected Route Detail*/}

                {selectedRoute && selectedRouteProgress && (
                  <div
                    className={[
                      "rounded-xl border p-4",
                      isDark
                        ? "border-[#20C7C2]/30 bg-[#243449]"
                        : "border-[#087F9B]/20 bg-[#DDF1F5]",
                    ].join(" ")}
                  >
                    <div className="flex items-center gap-2">
                      <Navigation size={18} className={accentText} />

                      <p className={`text-sm font-bold ${headingText}`}>
                        Current route: {selectedRoute.label}
                      </p>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-4">
                      <div>
                        <p className={`text-xs ${secondaryText}`}>
                          Remaining distance
                        </p>

                        <p className={`mt-1 text-lg font-bold ${headingText}`}>
                          {formatDistance(
                            selectedRouteProgress.remainingDistanceMeters,
                          )}
                        </p>
                      </div>

                      <div>
                        <p className={`text-xs ${secondaryText}`}>
                          Remaining time
                        </p>

                        <p className={`mt-1 text-lg font-bold ${headingText}`}>
                          {formatDuration(
                            selectedRouteProgress.remainingDurationSeconds,
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Alternative Routes */}

                <div className="space-y-3" aria-label="Route alternatives">
                  {routes.map((route, index) => {
                    const isSelected = route.id === selectedRouteId;

                    const progress =
                      routeProgress?.routeId === route.id
                        ? routeProgress
                        : null;

                    return (
                      <article
                        key={route.id}
                        aria-label={`${route.label} route`}
                        className={[
                          "rounded-xl border p-4 transition-all duration-200",
                          isSelected
                            ? isDark
                              ? "border-[#20C7C2] bg-[#243449]"
                              : "border-[#087F9B] bg-[#DDF1F5]"
                            : isDark
                              ? "border-[#33465C] bg-[#101827]"
                              : "border-[#DCE5EC] bg-white",
                        ].join(" ")}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className={`text-xs ${secondaryText}`}>
                              Route {index + 1}
                            </p>

                            <h4 className="mt-1 font-bold">{route.label}</h4>
                          </div>

                          {isSelected && (
                            <span
                              className={[
                                "rounded-full px-3 py-1 text-xs font-bold",
                                isDark
                                  ? "bg-[#20C7C2] text-[#101827]"
                                  : "bg-[#087F9B] text-white",
                              ].join(" ")}
                            >
                              Selected
                            </span>
                          )}
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3">
                          <div
                            className={[
                              "rounded-lg p-3",
                              isDark ? "bg-[#1B293B]" : "bg-[#EDF5F8]",
                            ].join(" ")}
                          >
                            <p className={`text-xs ${secondaryText}`}>
                              {progress ? "Remaining distance" : "Distance"}
                            </p>

                            <p className="mt-1 font-bold">
                              {formatDistance(
                                progress
                                  ? progress.remainingDistanceMeters
                                  : route.distanceMeters,
                              )}
                            </p>
                          </div>

                          <div
                            className={[
                              "rounded-lg p-3",
                              isDark ? "bg-[#1B293B]" : "bg-[#EDF5F8]",
                            ].join(" ")}
                          >
                            <p className={`text-xs ${secondaryText}`}>
                              {progress ? "Remaining time" : "Estimated time"}
                            </p>

                            <p className="mt-1 font-bold">
                              {formatDuration(
                                progress
                                  ? progress.remainingDurationSeconds
                                  : route.durationSeconds,
                              )}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() => {
                            matchCandidateRef.current = {
                              routeId: null,
                              count: 0,
                            };

                            setSelectedRouteId(route.id);
                          }}
                          className={[
                            "mt-3 flex w-full items-center justify-center gap-2",
                            "rounded-lg px-4 py-2.5 text-sm font-semibold",
                            "transition-all duration-200",
                            isSelected
                              ? accentButton
                              : isDark
                                ? "border border-[#20C7C2]/50 text-[#20C7C2] hover:bg-[#243449]"
                                : "border border-[#087F9B] text-[#087F9B] hover:bg-[#DDF1F5]",
                          ].join(" ")}
                        >
                          {isSelected ? (
                            <>
                              <BadgeCheck size={17} />
                              Selected Route
                            </>
                          ) : (
                            "Choose This Route"
                          )}
                        </button>
                      </article>
                    );
                  })}
                </div>

                {selectedRoute && (
                  <p className={`text-sm ${secondaryText}`}>
                    <strong className={headingText}>Selected:</strong>{" "}
                    {selectedRoute.label}
                  </p>
                )}
              </>
            )}


            {!routeRequestOrigin && routeStatus === "idle" && (
              <div
                className={[
                  "flex items-start gap-3 rounded-xl border p-4",
                  surfaceClass,
                ].join(" ")}
              >
                <MapPin size={19} className={`${accentText} mt-0.5 shrink-0`} />

                <p className={`text-sm ${secondaryText}`}>
                  A starting location is not available. Return to the finder and
                  search for a location.
                </p>
              </div>
            )}

          

            {!pharmacyCoordinatesValid && (
              <div
                role="alert"
                className={[
                  "flex items-start gap-3 rounded-xl border p-4",
                  isDark
                    ? "border-red-400/30 bg-red-950/30 text-red-300"
                    : "border-red-200 bg-red-50 text-red-700",
                ].join(" ")}
              >
                <AlertCircle size={19} className="mt-0.5 shrink-0" />

                <p className="text-sm">
                  This pharmacy does not have valid coordinates, so its route
                  cannot be calculated.
                </p>
              </div>
            )}
          </div>
        </div>

      

        <button
          type="button"
          aria-expanded={routesExpanded}
          aria-controls="route-drawer-content"
          onClick={() => setRoutesExpanded((previous) => !previous)}
          className={[
            "flex w-full items-center justify-between border-t px-5 py-4",
            "shadow-[0_-4px_12px_rgba(0,0,0,0.08)]",
            "transition-colors duration-200",
            isDark
              ? "border-[#33465C] bg-[#1B293B] text-[#F8FAFC] hover:bg-[#243449]"
              : "border-[#DCE5EC] bg-white text-[#18364A] hover:bg-[#EDF5F8]",
          ].join(" ")}
        >
          <span className="flex items-center gap-2 font-semibold">
            <Route size={18} className={accentText} />

            {routesExpanded ? "Hide Routes" : "Show Routes"}
          </span>

          {routesExpanded ? (
            <ChevronDown
              size={21}
              className={`${accentText} transition-transform duration-300`}
            />
          ) : (
            <ChevronUp
              size={21}
              className={`${accentText} transition-transform duration-300`}
            />
          )}
        </button>
      </section>
    </main>
  );
}
