import { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";

import { setPermissionModalOpen } from "../features/app/appSlice";
import { GEOLOCATION_CONFIG } from "../constants";

function getPermissionError(error) {
  if (error.code === 1) {
    return "Location access is blocked. Please enable it in your browser settings.";
  }

  if (error.code === 2) {
    return "Your device could not determine your location. Check your location settings.";
  }

  if (error.code === 3) {
    return "Location request timed out. Please try again.";
  }

  return "Unable to retrieve your current location.";
}

export default function useGeolocation() {
  const dispatch = useDispatch();

  const [permission, setPermission] = useState("checking");
  const [loading, setLoading] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [location, setLocation] = useState(null);

  const updatePermission = useCallback(
    (nextPermission) => {
      setPermission(nextPermission);

      dispatch(setPermissionModalOpen(nextPermission !== "granted"));
    },
    [dispatch],
  );

  // Silently inspect the current browser permission.
  useEffect(() => {
    let active = true;
    let permissionStatus = null;

    async function checkPermission() {
      if (
        !navigator.permissions ||
        typeof navigator.permissions.query !== "function"
      ) {
        if (active) updatePermission("unknown");
        return;
      }

      try {
        permissionStatus = await navigator.permissions.query({
          name: "geolocation",
        });

        if (!active) return;

        updatePermission(permissionStatus.state);

        permissionStatus.onchange = () => {
          if (!active) return;

          const nextPermission = permissionStatus.state;

          updatePermission(nextPermission);

          if (nextPermission !== "granted") {
            setLocation(null);

            setLocationError(
              nextPermission === "denied"
                ? "Location access is blocked. Enable it in your browser settings."
                : "",
            );
          } else {
            setLocationError("");
          }
        };
      } catch {
        if (active) updatePermission("unknown");
      }
    }

    checkPermission();

    return () => {
      active = false;

      if (permissionStatus) {
        permissionStatus.onchange = null;
      }
    };
  }, [updatePermission]);

  // Called only after an explicit user action or when a
  // feature needs location and permission is already granted.
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      const error = new Error("Geolocation is not supported by this browser.");

      setLocationError(error.message);
      return Promise.reject(error);
    }

    setLoading(true);
    setLocationError("");

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = Number(position.coords.latitude);
          const lon = Number(position.coords.longitude);

          if (
            !Number.isFinite(lat) ||
            !Number.isFinite(lon) ||
            lat < -90 ||
            lat > 90 ||
            lon < -180 ||
            lon > 180
          ) {
            const error = new Error(
              "The browser returned invalid location coordinates.",
            );

            setLoading(false);
            setLocationError(error.message);
            reject(error);
            return;
          }

          const result = { lat, lon };

          setLocation(result);
          setLoading(false);
          setLocationError("");
          updatePermission("granted");

          resolve(result);
        },
        (error) => {
          const message = getPermissionError(error);

          setLoading(false);
          setLocationError(message);

          if (error.code === 1) {
            setLocation(null);
            updatePermission("denied");
          }

          reject(new Error(message, { cause: error }));
        },
        {
          enableHighAccuracy: GEOLOCATION_CONFIG.ENABLE_HIGH_ACCURACY,
          timeout: GEOLOCATION_CONFIG.TIMEOUT,
          maximumAge: GEOLOCATION_CONFIG.MAXIMUM_AGE,
        },
      );
    });
  }, [updatePermission]);

  return {
    permission,
    loading,
    location,
    locationError,
    getCurrentLocation,
  };
}
