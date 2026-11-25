import { useEffect } from "react";
import { useSelector } from "react-redux";
import "./BootAnimation.css";

const BOOT_DURATION = 6500;
const REDUCED_DURATION = 700;

export default function BootAnimation({ onComplete }) {
  const isDark = useSelector((state) => state.app.theme) === "dark";

  useEffect(() => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const timeout = window.setTimeout(
      () => onComplete?.(),
      reducedMotion ? REDUCED_DURATION : BOOT_DURATION,
    );

    return () => window.clearTimeout(timeout);
  }, [onComplete]);

  return (
    <div
      className={`rx-boot ${isDark ? "rx-boot-dark" : "rx-boot-light"}`}
      role="status"
      aria-label="RxNear is starting"
      aria-live="polite"
    >
      <div className="rx-boot-scene">
        {/* LEFT: PHARMACY BUILDING */}
        <div className="rx-pharmacy-position">
          <div className="rx-pharmacy-logo" aria-hidden="true">
            <div className="rx-pharmacy-building">
              <div className="rx-pharmacy-sign">
                <span>+</span>
              </div>

              <div className="rx-building-roof" />

              <div className="rx-building-facade">
                <div className="rx-building-window rx-window-left" />
                <div className="rx-building-door">
                  <span className="rx-door-handle" />
                </div>
                <div className="rx-building-window rx-window-right" />
              </div>

              <div className="rx-building-base" />
            </div>

            <span className="rx-pharmacy-caption">PHARMACY</span>
          </div>
        </div>

        {/* TRUE SCREEN-CENTRED ANIMATION */}
        <div className="rx-center-stage">
          {/* ECG */}
          <div className="rx-ecg" aria-hidden="true">
            <svg
              viewBox="0 0 420 110"
              className="rx-ecg-svg"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                className="rx-ecg-line"
                d="M5 55 H105 L130 55 L150 38 L170 74 L195 10 L220 96 L245 55 H415"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* DIAGONAL PILL */}
          <div className="rx-pill" aria-hidden="true">
            <span className="rx-pill-white" />
            <span className="rx-pill-colour" />
            <span className="rx-pill-divider" />
          </div>

          {/* BRAND */}
          <div className="rx-brand">
            <h1 className="rx-brand-title">
              <span className="rx-brand-rx">Rx</span>
              <span className="rx-brand-near">Near</span>
            </h1>

            <p className="rx-brand-tagline">
              Find Pharmacies When You Need It Most
            </p>
          </div>
        </div>
      </div>

      {/* THREE REPEATING DOTS */}
      <div className="rx-boot-status" aria-hidden="true">
        <div className="rx-loading-dots">
          <span />
          <span />
          <span />
        </div>
        <span>Loading Functionality</span>
      </div>
    </div>
  );
}
