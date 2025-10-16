import React, { useContext } from "react";
import { useParams, useLocation } from "react-router-dom";
import Attendance from "./Attendance";
import { AppContext } from "../context/AppContext";

// Parse module time string into slots: "8.00 - 10.00, 13.00 - 15.00"
const parseTimeSlots = (timeStr) => {
  if (!timeStr) return [];
  return timeStr.split(",").map((slot) => {
    const [start, end] = slot.split("-").map((t) => t.trim().replace(".", ":"));
    return { start, end };
  });
};

const ModuleDetails = () => {
  const { moduleName } = useParams();
  const location = useLocation();
  const { day, time } = location.state || {};

  const { modules, loadingModules, darkMode } = useContext(AppContext);
  const moduleData = modules.filter((m) => m.name === moduleName);
  const timeSlots = parseTimeSlots(time); // Array of { start, end }
  const primaryColor = "#01996f";

  const bg = darkMode ? "bg-gray-900" : "bg-white";
  const textColor = darkMode ? "text-gray-100" : "text-black";
  const cardBg = darkMode ? "bg-gray-800" : "bg-green-200";
  const badgeBg = darkMode ? "bg-gray-700" : "bg-green-200";
  const badgeText = primaryColor;

  if (loadingModules) {
    return (
      <div className={`flex justify-center items-center min-h-[600px] ${bg}`}>
        <div
          className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent"
          style={{ borderColor: primaryColor }}
        ></div>
      </div>
    );
  }

  return (
    <div className={`px-4 sm:px-8 lg:px-16 mx-auto py-8 ${bg} ${textColor} min-h-screen`}>
      {/* Module Name */}
      <div
        className={`border border-gray-800 rounded-2xl shadow-lg py-6 px-4 text-center mb-10 border-l-4 border-b-4 `}
        style={{ borderColor: primaryColor }}
      >
        <h1 className="text-lg md:text-4xl font-bold">
          {moduleName}
        </h1>

        {/* Schedule */}
        {moduleData.length > 0 && (
          <div className="flex flex-col md:flex-row items-center gap-3 mt-4">
            <h2 className={`md:text-2xl font-semibold ${darkMode ? "text-gray-300" : "text-black"}`}>
              Schedule
            </h2>
            <div className="flex flex-wrap gap-3 mt-2 md:mt-0">
              {moduleData.map((data, idx) => (
                <span
                  key={idx}
                  className={`text-xs md:text-md px-3 py-1 md:py-2 rounded-full font-medium hover:opacity-90 transition-colors`}
                  style={{ backgroundColor: badgeBg, color: badgeText }}
                >
                  {data.day} ({data.time})
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Attendance */}
      <div
        className={`shadow-md rounded-xl p-3 border`}
        style={{ backgroundColor: cardBg, borderColor: darkMode ? "#374151" : primaryColor }}
      >
        <h2 className="text-xl md:text-2xl font-semibold mb-2" style={{ color: primaryColor }}>
          Attendance
        </h2>
        <Attendance day={day} timeSlots={timeSlots} />
      </div>
    </div>
  );
};

export default ModuleDetails;
