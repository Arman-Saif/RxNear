import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Siren } from "lucide-react";

export default function EmergencyFAB() {
  const navigate = useNavigate();
  const location = useLocation();

  const isDark = useSelector((state) => state.app.theme) === "dark";

  function openEmergencyPage() {
    navigate("/emergency", {
      state: location.state || {},
    });
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openEmergencyPage();
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={openEmergencyPage}
      onKeyDown={handleKeyDown}
      aria-label="Open emergency services"
      title="Emergency Services"
      className={[
        "fixed bottom-6 right-5 z-[1100]",
        "flex h-14 w-14 cursor-pointer items-center justify-center",
        "rounded-full border border-red-400/30",
        "bg-red-600 text-white",
        "shadow-xl shadow-red-600/30",
        "transition-all duration-200",
        "hover:-translate-y-1 hover:bg-red-700",
        "active:scale-95",
        "focus:outline-none focus-visible:ring-4",
        "focus-visible:ring-red-400/50",
        "sm:bottom-8 sm:right-8",
        isDark ? "shadow-red-500/25" : "shadow-red-600/25",
      ].join(" ")}
    >
      <Siren size={25} strokeWidth={2.2} />
    </div>
  );
}
