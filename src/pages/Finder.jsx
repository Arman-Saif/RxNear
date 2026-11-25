import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Search, ShieldCheck } from "lucide-react";

import SearchBar from "../components/SearchBar";
import BootAnimation from "../animations/BootAnimation";
import SearchingAnimation from "../animations/SearchingAnimation";

import { geocodeAddress } from "../services/geocoding";
import { searchNearbyPharmacies } from "../services/pharmecySearch";

import {
  clearPharmacies,
  setPharmacies,
  setSearchError,
  setSearchMeta,
  setSearchStatus,
} from "../features/pharmacy/pharmacySlice";

const SEARCH_TIMEOUT = 7000;

export default function Finder() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const isDark = useSelector((state) => state.app.theme) === "dark";

  const [searchError, setSearchErrorMessage] = useState("");
  const [searching, setSearching] = useState(false);
  const [bootComplete, setBootComplete] = useState(false);
  const [showSearchAnimation, setShowSearchAnimation] = useState(false);
  const [searchAnimationKey, setSearchAnimationKey] = useState(0);

  const activeController = useRef(null);
  const animationCompleted = useRef(false);
  const pendingNavigation = useRef(null);

  const handleBootComplete = useCallback(() => {
    setBootComplete(true);
  }, []);

  const navigateToResults = useCallback(
    (navigationState) => {
      navigate("/results", {
        state: navigationState,
      });
    },
    [navigate],
  );

  const handleSearchAnimationComplete = useCallback(() => {
    animationCompleted.current = true;
    setShowSearchAnimation(false);

    if (pendingNavigation.current) {
      const navigationState = pendingNavigation.current;
      pendingNavigation.current = null;
      navigateToResults(navigationState);
    }
  }, [navigateToResults]);

  useEffect(() => {
    return () => {
      activeController.current?.abort();
      activeController.current = null;
    };
  }, []);

  const handleSearch = useCallback(
    async ({ query, coordinates }) => {
      activeController.current?.abort();

      const controller = new AbortController();
      activeController.current = controller;

      let timedOut = false;

      animationCompleted.current = false;
      pendingNavigation.current = null;

      setSearchAnimationKey((current) => current + 1);
      setShowSearchAnimation(true);
      setSearching(true);
      setSearchErrorMessage("");

      dispatch(clearPharmacies());
      dispatch(setSearchStatus("loading"));

      const timeout = window.setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, SEARCH_TIMEOUT);

      try {
        let origin = coordinates;

        if (!origin) {
          origin = await geocodeAddress(query, controller.signal);
        }

        if (activeController.current !== controller) return;

        if (controller.signal.aborted) {
          throw new Error("SEARCH_TIMEOUT");
        }

        const result = await searchNearbyPharmacies(origin, {
          signal: controller.signal,
        });

        if (activeController.current !== controller) return;

        if (controller.signal.aborted) {
          throw new Error("SEARCH_TIMEOUT");
        }

        const pharmacies = Array.isArray(result?.pharmacies)
          ? result.pharmacies
          : [];

        dispatch(setSearchMeta(result?.searchMeta || {}));

        if (pharmacies.length === 0) {
          const message =
            "No pharmacies were found near this location. Try another area.";

          dispatch(setSearchError(message));
          setSearchErrorMessage(message);
          return;
        }

        dispatch(setPharmacies(pharmacies));
        dispatch(setSearchStatus("succeeded"));

        const navigationState = {
          origin,
          searchQuery: query,
        };

        if (animationCompleted.current) {
          navigateToResults(navigationState);
        } else {
          pendingNavigation.current = navigationState;
        }
      } catch (error) {
        if (activeController.current !== controller) return;

        const message = timedOut
          ? "The search took too long. The server did not respond within 7 seconds. Please try again."
          : error?.message || "Unable to search for nearby pharmacies.";

        dispatch(setSearchError(message));
        setSearchErrorMessage(message);
      } finally {
        window.clearTimeout(timeout);

        if (activeController.current === controller) {
          activeController.current = null;
          setSearching(false);
        }
      }
    },
    [dispatch, navigateToResults],
  );

  const surface = isDark
    ? "border-[#33465C] bg-[#1B293B]"
    : "border-[#DCE5EC] bg-white";

  const mutedText = isDark ? "text-[#A7B5C8]" : "text-[#718A9B]";

  return (
    <>
      <main
        className={[
          "mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8",
          isDark ? "text-[#F8FAFC]" : "text-[#18364A]",
        ].join(" ")}
        aria-busy={!bootComplete || searching}
      >
        <button
          type="button"
          onClick={() => navigate("/")}
          disabled={!bootComplete || searching}
          className={[
            "mb-8 inline-flex items-center gap-2 rounded-xl px-3 py-2",
            "text-sm font-semibold transition-colors",
            "disabled:pointer-events-none disabled:opacity-50",
            isDark
              ? "text-[#A7B5C8] hover:bg-[#243449] hover:text-white"
              : "text-[#718A9B] hover:bg-[#DDF1F5] hover:text-[#18364A]",
          ].join(" ")}
        >
          <ArrowLeft size={17} />
          Back to Home
        </button>

        <section
          className={[
            "overflow-hidden rounded-[2rem] border shadow-sm",
            surface,
          ].join(" ")}
        >
          <div className="bg-[#087F9B] px-6 py-10 text-white sm:px-10 sm:py-12">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold tracking-wider">
              <MapPin size={14} />
              PHARMACY LOCATOR
            </span>

            <h1 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Find a pharmacy near you
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/80 sm:text-base">
              Enter a location or use your current location to discover nearby
              pharmacies.
            </p>
          </div>

          <div className="p-5 sm:p-9">
            <div className="mb-6 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#20C7C2]/15 text-[#087F9B]">
                <Search size={21} />
              </span>

              <div>
                <h2 className="font-bold">Search location</h2>
                <p className={`text-sm ${mutedText}`}>
                  Choose a place to look for pharmacies.
                </p>
              </div>
            </div>

            <SearchBar
              onSearch={handleSearch}
              disabled={!bootComplete || searching}
            />

            {searchError && (
              <div
                role="alert"
                className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-300"
              >
                <p className="font-semibold">Search unsuccessful</p>
                <p className="mt-1">{searchError}</p>
              </div>
            )}

            <div
              className={[
                "mt-8 flex items-start gap-3 rounded-2xl p-4",
                isDark ? "bg-[#243449]" : "bg-[#DDF1F5]/70",
              ].join(" ")}
            >
              <ShieldCheck
                size={20}
                className="mt-0.5 shrink-0 text-[#087F9B]"
              />

              <p className={`text-xs leading-6 ${mutedText}`}>
                Your location is used to perform the search. RxNear does not
                intentionally save your coordinates in persistent browser
                storage.
              </p>
            </div>
          </div>
        </section>
      </main>

      {!bootComplete && <BootAnimation onComplete={handleBootComplete} />}

      {showSearchAnimation && (
        <SearchingAnimation
          key={searchAnimationKey}
          isSearching={searching}
          onComplete={handleSearchAnimationComplete}
        />
      )}
    </>
  );
}
