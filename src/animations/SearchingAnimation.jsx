import { useCallback, useEffect, useRef } from "react";
import { useSelector } from "react-redux";

import "./SearchingAnimation.css";

const MIN_DURATION = 2000;
const MAX_DURATION = 7000;

export default function SearchingAnimation({ isSearching = true, onComplete }) {
  const isDark = useSelector((state) => state.app.theme) === "dark";

  const startedAtRef = useRef(Date.now());
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const finishAnimation = useCallback(() => {
    if (completedRef.current) return;

    completedRef.current = true;
    onCompleteRef.current?.();
  }, []);

  // Maximum animation duration: 7 seconds.
  useEffect(() => {
    const maxTimer = window.setTimeout(finishAnimation, MAX_DURATION);

    return () => window.clearTimeout(maxTimer);
  }, [finishAnimation]);

  // If the search finishes, wait until the minimum 2-second duration.
  useEffect(() => {
    if (isSearching || completedRef.current) return;

    const elapsed = Date.now() - startedAtRef.current;
    const remaining = Math.max(0, MIN_DURATION - elapsed);

    const finishTimer = window.setTimeout(finishAnimation, remaining);

    return () => window.clearTimeout(finishTimer);
  }, [isSearching, finishAnimation]);

  return (
    <div
      className={[
        "fixed inset-0 z-[2000] flex min-h-screen",
        "flex-col items-center justify-center overflow-hidden",
        "px-5 text-center",
        isDark
          ? "rx-search-space text-[#F8FAFC]"
          : "rx-search-day text-[#18364A]",
      ].join(" ")}
      role="status"
      aria-live="polite"
      aria-label="Searching for nearby pharmacies"
    >
      {/* Background atmosphere */}
      <div className="rx-search-stars" aria-hidden="true" />
      <div className="rx-search-glow" aria-hidden="true" />

      {/* Planet scene */}
      <div className="rx-search-scene" aria-hidden="true">
        <div className="rx-search-orbit rx-search-orbit-one" />
        <div className="rx-search-orbit rx-search-orbit-two" />

        <div className="rx-search-earth">
          <div className="rx-search-earth-clouds" />
          <div className="rx-search-earth-land" />
          <div className="rx-search-earth-shine" />
        </div>

        {/* Rotating magnifying glass */}
        <div className="rx-search-magnifier-orbit">
          <div className="rx-search-magnifier">
            <div className="rx-search-magnifier-glass" />
            <div className="rx-search-magnifier-handle" />
          </div>
        </div>

        <div className="rx-search-scan" />
      </div>

      {/* Search information */}
      <div className="relative z-10 mt-8 flex flex-col items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#20C7C2] shadow-[0_0_12px_#20C7C2]" />
          <p className="text-xs font-bold uppercase tracking-[0.28em] opacity-80">
            RxNear Discovery
          </p>
        </div>

        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Searching for pharmacies
        </h2>

        <p
          className={[
            "max-w-sm text-sm leading-relaxed",
            isDark ? "text-[#A7B5C8]" : "text-[#718A9B]",
          ].join(" ")}
        >
          Exploring your area to find nearby pharmacies...
        </p>

        <div className="mt-2 flex items-center gap-2">
          <span className="rx-search-dot" />
          <span className="rx-search-dot rx-search-dot-two" />
          <span className="rx-search-dot rx-search-dot-three" />
        </div>
      </div>
    </div>
  );
}
