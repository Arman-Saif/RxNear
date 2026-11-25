import { useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

import Landing from "./pages/Landing";
import Finder from "./pages/Finder";
import Emergency from "./pages/Emergency";

import Header from "./components/Header";
import PharmacyList from "./components/PharmacyList";
import DetailedPharmacy from "./components/DetailedPharmecy";
import EmergencyFAB from "./components/EmergencyFAB";
import AppFooter from "./components/AppFooter";

export default function App() {
  const location = useLocation();

  const theme = useSelector((state) => state.app.theme);
  const isDark = theme === "dark";

  return (
    <div
      className={[
        "relative flex min-h-screen flex-col transition-colors duration-200",
        isDark ? "bg-[#101827] text-[#F8FAFC]" : "bg-[#EDF5F8] text-[#18364A]",
      ].join(" ")}
    >
      <Header />

      <div className="flex-1">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/finder" element={<Finder />} />
          <Route path="/results" element={<PharmacyList />} />
          <Route path="/pharmacy-details" element={<DetailedPharmacy />} />
          <Route path="/emergency" element={<Emergency />} />
          <Route path="*" element={<Landing />} />
        </Routes>
      </div>

      <EmergencyFAB />

      <AppFooter />
    </div>
  );
}
