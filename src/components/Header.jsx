import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Activity, MapPin, Menu, Moon, ShieldPlus, Sun, X } from "lucide-react";

import { toggleTheme } from "../features/app/appSlice";

export default function Header() {
  const dispatch = useDispatch();
  const location = useLocation();

  const theme = useSelector((state) => state.app.theme);
  const isDark = theme === "dark";

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navItems = [
    {
      label: "Home",
      path: "/",
      icon: Activity,
    },
    {
      label: "Find Pharmacies",
      path: "/finder",
      icon: MapPin,
    },
    {
      label: "Emergency",
      path: "/emergency",
      icon: ShieldPlus,
    },
  ];

  const linkClass = ({ isActive }) =>
    [
      "flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors duration-200",
      isActive
        ? isDark
          ? "bg-[#243449] text-[#20C7C2]"
          : "bg-[#DDF1F5] text-[#087F9B]"
        : isDark
          ? "text-[#A7B5C8] hover:bg-[#243449] hover:text-[#F8FAFC]"
          : "text-[#718A9B] hover:bg-[#DDF1F5] hover:text-[#18364A]",
    ].join(" ");

  return (
    <header
      className={[
        "sticky top-0 z-50 w-full border-b backdrop-blur-xl",
        isDark
          ? "border-[#33465C] bg-[#101827]/95"
          : "border-[#DCE5EC] bg-[#EDF5F8]/95",
      ].join(" ")}
    >
      <div className="mx-auto flex min-h-[76px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <NavLink
          to={"/"}
          className="flex shrink-0 items-center gap-3"
          aria-label="RxNear home"
        >
          <span
            className={[
              "flex h-11 w-11 items-center justify-center rounded-2xl",
              isDark
                ? "bg-[#243449] text-[#20C7C2]"
                : "bg-[#DDF1F5] text-[#087F9B]",
            ].join(" ")}
          >
            <Activity size={25} strokeWidth={2.5} />
          </span>

          <span className="flex flex-col">
            <span
              className={[
                "text-xl font-extrabold tracking-tight",
                isDark ? "text-[#F8FAFC]" : "text-[#18364A]",
              ].join(" ")}
            >
              Rx
              <span className={isDark ? "text-[#20C7C2]" : "text-[#087F9B]"}>
                Near
              </span>
            </span>

            <span
              className={[
                "text-[10px] font-medium tracking-[0.16em]",
                isDark ? "text-[#A7B5C8]" : "text-[#718A9B]",
              ].join(" ")}
            >
              PHARMACY FINDER
            </span>
          </span>
        </NavLink>

        {/* Desktop navigation */}
        <nav
          aria-label="Main navigation"
          className="hidden items-center gap-2 md:flex"
        >
          {navItems.map(({ label, path, icon: Icon }) => (
            <NavLink key={path} to={path} className={linkClass}>
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => dispatch(toggleTheme())}
            aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
            title={`Switch to ${isDark ? "light" : "dark"} theme`}
            className={[
              "flex h-11 w-11 items-center justify-center rounded-xl border transition-all duration-200",
              isDark
                ? "border-[#33465C] bg-[#1B293B] text-[#20C7C2] hover:bg-[#243449]"
                : "border-[#DCE5EC] bg-white text-[#087F9B] hover:bg-[#DDF1F5]",
            ].join(" ")}
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-label={
              mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"
            }
            aria-expanded={mobileMenuOpen}
            className={[
              "flex h-11 w-11 items-center justify-center rounded-xl border md:hidden",
              isDark
                ? "border-[#33465C] bg-[#1B293B] text-[#F8FAFC]"
                : "border-[#DCE5EC] bg-white text-[#18364A]",
            ].join(" ")}
          >
            {mobileMenuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </div>

      {/* Mobile navigation */}
      {mobileMenuOpen && (
        <nav
          aria-label="Mobile navigation"
          className={[
            "border-t px-4 py-3 md:hidden",
            isDark
              ? "border-[#33465C] bg-[#101827]"
              : "border-[#DCE5EC] bg-[#EDF5F8]",
          ].join(" ")}
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-2">
            {navItems.map(({ label, path, icon: Icon }) => (
              <NavLink key={path} to={path} className={linkClass}>
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
