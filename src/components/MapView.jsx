import { useEffect, useMemo } from "react";
import { useSelector } from "react-redux";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  CircleMarker,
  useMap,
} from "react-leaflet";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { GEOAPIFY_KEY, API_ENDPOINTS, MAP_CONFIG } from "../constants";

import { MapPin, Map as MapIcon } from "lucide-react";

import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIconRetina from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const defaultMarker = new L.Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIconRetina,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const ROUTE_COLORS = ["#2563eb", "#16a34a", "#9333ea", "#ea580c", "#0891b2"];

function normalizeCoordinates(point) {
  if (
    !point ||
    point.lat === null ||
    point.lon === null ||
    point.lat === undefined ||
    point.lon === undefined ||
    point.lat === "" ||
    point.lon === ""
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

function MapUpdater({
  center,
  currentLocation,
  selectedPharmacy,
  zoom,
  followUser,
}) {
  const map = useMap();

  useEffect(() => {
    const current = normalizeCoordinates(currentLocation);
    const selected = normalizeCoordinates(selectedPharmacy);
    const fallback = normalizeCoordinates(center);

    if (followUser && current) {
      map.panTo([current.lat, current.lon], {
        animate: true,
        duration: 0.5,
      });
      return;
    }

    const target = selected || fallback;

    if (!target) return;

    map.setView(
      [target.lat, target.lon],
      selected ? MAP_CONFIG.DETAIL_ZOOM : zoom,
    );
  }, [
    map,
    center?.lat,
    center?.lon,
    currentLocation?.lat,
    currentLocation?.lon,
    selectedPharmacy?.id,
    selectedPharmacy?.lat,
    selectedPharmacy?.lon,
    zoom,
    followUser,
  ]);

  return null;
}

function RouteBounds({ coordinates, routeId, followUser }) {
  const map = useMap();

  useEffect(() => {
    if (followUser) return;
    if (!coordinates || coordinates.length < 2) return;

    const bounds = L.latLngBounds(coordinates);

    if (bounds.isValid()) {
      map.fitBounds(bounds, {
        padding: [35, 35],
        maxZoom: 15,
      });
    }
  }, [map, routeId, coordinates, followUser]);

  return null;
}

export default function MapView({
  pharmacies = [],
  selectedPharmacy = null,
  center = null,
  currentLocation = null,
  followUser = false,
  zoom = MAP_CONFIG.DEFAULT_ZOOM,
  routeCoordinates = [],
  routeAlternatives = [],
  selectedRouteId = null,
  onSelectPharmacy,
}) {
  const theme = useSelector((state) => state.app.theme);
  const isDark = theme === "dark";

  const validPharmacies = useMemo(() => {
    return pharmacies
      .map((pharmacy) => {
        const coordinates = normalizeCoordinates(pharmacy);

        if (!coordinates) return null;

        return {
          ...pharmacy,
          ...coordinates,
        };
      })
      .filter(Boolean);
  }, [pharmacies]);

  const validSelectedCoordinates = normalizeCoordinates(selectedPharmacy);

  const validSelectedPharmacy = validSelectedCoordinates
    ? {
        ...selectedPharmacy,
        ...validSelectedCoordinates,
      }
    : null;

  const validCenter = normalizeCoordinates(center);
  const validCurrentLocation = normalizeCoordinates(currentLocation);

  const validRoutes = useMemo(() => {
    const routes =
      routeAlternatives.length > 0
        ? routeAlternatives
        : routeCoordinates.length > 0
          ? [
              {
                id: "default",
                coordinates: routeCoordinates,
              },
            ]
          : [];

    return routes
      .map((route) => {
        const coordinates = (route.coordinates || [])
          .filter(
            (point) =>
              Array.isArray(point) &&
              point.length >= 2 &&
              Number.isFinite(Number(point[0])) &&
              Number.isFinite(Number(point[1])) &&
              Math.abs(Number(point[0])) <= 90 &&
              Math.abs(Number(point[1])) <= 180,
          )
          .map(([lat, lon]) => [Number(lat), Number(lon)]);

        if (coordinates.length < 2) return null;

        return {
          ...route,
          coordinates,
        };
      })
      .filter(Boolean);
  }, [routeAlternatives, routeCoordinates]);

  const activeRoute =
    validRoutes.find((route) => route.id === selectedRouteId) ||
    validRoutes[0] ||
    null;

  const initialCenter = validCurrentLocation
    ? [validCurrentLocation.lat, validCurrentLocation.lon]
    : validCenter
      ? [validCenter.lat, validCenter.lon]
      : validPharmacies.length
        ? [validPharmacies[0].lat, validPharmacies[0].lon]
        : MAP_CONFIG.DEFAULT_CENTER;

  const fallbackClass = [
    "flex min-h-52 flex-col items-center justify-center rounded-2xl border p-6 text-center",
    isDark
      ? "border-[#33465C] bg-[#1B293B] text-[#A7B5C8]"
      : "border-[#DCE5EC] bg-white text-[#718A9B]",
  ].join(" ");

  if (!GEOAPIFY_KEY) {
    return (
      <section className={fallbackClass} aria-label="Pharmacy map">
        <MapIcon size={32} className="mb-3 text-[#087F9B]" />
        <h2 className="font-bold text-current">Map unavailable</h2>
        <p className="mt-2 text-sm">
          The Geoapify API key is missing. Check your environment configuration.
        </p>
      </section>
    );
  }

  if (validPharmacies.length === 0 && !validSelectedPharmacy) {
    return (
      <section className={fallbackClass} aria-label="Pharmacy map">
        <MapPin size={32} className="mb-3 text-[#087F9B]" />
        <h2 className="font-bold text-current">No map locations available</h2>
        <p className="mt-2 text-sm">
          No valid pharmacy coordinates are available to display on the map.
        </p>
      </section>
    );
  }

  return (
    <section
      aria-label="Pharmacy map"
      className={[
        "overflow-hidden rounded-3xl border shadow-sm",
        isDark ? "border-[#33465C] bg-[#1B293B]" : "border-[#DCE5EC] bg-white",
      ].join(" ")}
    >
      <div
        className={[
          "flex items-center gap-3 border-b px-4 py-4 sm:px-5",
          isDark ? "border-[#33465C]" : "border-[#DCE5EC]",
        ].join(" ")}
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#20C7C2]/15 text-[#087F9B]">
          <MapIcon size={20} />
        </span>

        <div>
          <h2
            className={[
              "text-sm font-bold",
              isDark ? "text-[#F8FAFC]" : "text-[#18364A]",
            ].join(" ")}
          >
            Pharmacy Map
          </h2>
          <p
            className={[
              "text-xs",
              isDark ? "text-[#A7B5C8]" : "text-[#718A9B]",
            ].join(" ")}
          >
            Explore pharmacy locations and routes
          </p>
        </div>
      </div>

      <div className="relative h-[360px] w-full sm:h-[420px] lg:h-[480px]">
        <MapContainer
          center={initialCenter}
          zoom={zoom}
          scrollWheelZoom
          className="z-0 h-full w-full"
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors, &copy; Geoapify"
            url={`${API_ENDPOINTS.TILES}?apiKey=${GEOAPIFY_KEY}`}
          />

          <MapUpdater
            center={validCenter}
            currentLocation={validCurrentLocation}
            selectedPharmacy={validSelectedPharmacy}
            zoom={zoom}
            followUser={followUser}
          />

          {validPharmacies.map((pharmacy) => (
            <Marker
              key={pharmacy.id}
              position={[pharmacy.lat, pharmacy.lon]}
              icon={defaultMarker}
              eventHandlers={{
                click: () => onSelectPharmacy?.(pharmacy),
              }}
            >
              <Popup>
                <strong>{pharmacy.name}</strong>
                <p>{pharmacy.address}</p>

                <button
                  type="button"
                  onClick={() => onSelectPharmacy?.(pharmacy)}
                >
                  Select Pharmacy
                </button>
              </Popup>
            </Marker>
          ))}

          {validSelectedPharmacy &&
            !validPharmacies.some(
              (item) => item.id === validSelectedPharmacy.id,
            ) && (
              <Marker
                position={[
                  validSelectedPharmacy.lat,
                  validSelectedPharmacy.lon,
                ]}
                icon={defaultMarker}
              >
                <Popup>{validSelectedPharmacy.name}</Popup>
              </Marker>
            )}

          {validCurrentLocation && (
            <CircleMarker
              center={[validCurrentLocation.lat, validCurrentLocation.lon]}
              radius={9}
              pathOptions={{
                color: "#ffffff",
                weight: 3,
                fillColor: "#2563eb",
                fillOpacity: 1,
              }}
            >
              <Popup>Your current location</Popup>
            </CircleMarker>
          )}

          {validRoutes.map((route, index) => {
            const isSelected = route.id === activeRoute?.id;

            return (
              <Polyline
                key={route.id || index}
                positions={route.coordinates}
                pathOptions={{
                  color: ROUTE_COLORS[index % ROUTE_COLORS.length],
                  weight: isSelected ? 8 : 4,
                  opacity: isSelected ? 1 : 0.55,
                }}
              />
            );
          })}

          {activeRoute && (
            <RouteBounds
              coordinates={activeRoute.coordinates}
              routeId={activeRoute.id}
              followUser={followUser}
            />
          )}
        </MapContainer>
      </div>
    </section>
  );
}
