import { useSelector } from "react-redux";

export default function LocationPermissionModal({
  open,
  onGrant,
  onReject,
  loading = false,
  error = "",
  permission = "unknown",
}) {
  const theme = useSelector((state) => state.app.theme);
  const isDark = theme === "dark";

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="location-dialog-title"
        className={`w-full max-w-md overflow-hidden rounded-2xl border shadow-2xl transition-colors duration-300 ${
          isDark
            ? "border-[#33465C] bg-[#1B293B] text-[#F8FAFC]"
            : "border-[#DCE5EC] bg-white text-[#18364A]"
        }`}
      >
        <div
          className={`h-1.5 w-full ${isDark ? "bg-[#20C7C2]" : "bg-[#087F9B]"}`}
        />

        <div className="p-6 sm:p-8">
          <div
            className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${
              isDark ? "bg-[#243449]" : "bg-[#DDF1F5]"
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className={`h-7 w-7 ${
                isDark ? "text-[#20C7C2]" : "text-[#087F9B]"
              }`}
              aria-hidden="true"
            >
              <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
              <circle cx="12" cy="10" r="2.5" />
            </svg>
          </div>

          <h2
            id="location-dialog-title"
            className="text-2xl font-bold tracking-tight"
          >
            Allow Location Access
          </h2>

          <p
            className={`mt-3 text-sm leading-6 ${
              isDark ? "text-[#A7B5C8]" : "text-[#718A9B]"
            }`}
          >
            RxNear can use your current location to find nearby pharmacies and
            calculate routes to them.
          </p>

          {permission === "denied" && (
            <div
              role="alert"
              className={`mt-5 rounded-xl border p-3 text-sm leading-5 ${
                isDark
                  ? "border-red-400/30 bg-red-400/10 text-red-200"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              Location access is blocked by your browser. You may need to enable
              it in site settings.
            </div>
          )}

          {error && (
            <div
              role="alert"
              className={`mt-3 rounded-xl border p-3 text-sm leading-5 ${
                isDark
                  ? "border-red-400/30 bg-red-400/10 text-red-200"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {error}
            </div>
          )}

          <div className="mt-7 flex flex-col gap-3">
            <button
              type="button"
              onClick={onGrant}
              disabled={loading || permission === "denied"}
              className={`w-full rounded-xl px-5 py-3.5 text-sm font-semibold text-white shadow-lg transition-all duration-200 ${
                isDark
                  ? "bg-[#20C7C2] shadow-[#20C7C2]/10 hover:bg-[#35DCE0]"
                  : "bg-[#087F9B] shadow-[#087F9B]/10 hover:bg-[#066B82]"
              } disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {loading ? "Requesting Location..." : "Grant Location"}
            </button>

            <button
              type="button"
              onClick={onReject}
              disabled={loading}
              className={`w-full rounded-xl border px-5 py-3.5 text-sm font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${
                isDark
                  ? "border-[#33465C] bg-[#243449] text-[#D5E1EE] hover:bg-[#2D4058]"
                  : "border-[#DCE5EC] bg-[#F5FAFC] text-[#18364A] hover:bg-[#E5F1F5]"
              }`}
            >
              Continue Without Location
            </button>
          </div>

          <p
            className={`mt-5 text-center text-xs ${
              isDark ? "text-[#8092A8]" : "text-[#8A9BA8]"
            }`}
          >
            Your location is used to find nearby pharmacies.
          </p>
        </div>
      </section>
    </div>
  );
}
