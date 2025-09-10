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

  const { modules, loadingModules } = useContext(AppContext);

  const moduleData = modules.filter((m) => m.name === moduleName);
  const timeSlots = parseTimeSlots(time); // Array of { start, end }

  if (loadingModules) {
    return (
      <div className="flex justify-center items-center min-h-[600px]">
        <div
          className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4"
          style={{ color: "#02c986" }}
        ></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 mt-10">
      {/* Module Name */}
      <div className="bg-gradient-to-r from-green-400 to-blue-500 text-white rounded-xl shadow-lg p-3 mb-8 text-center">
        <h1 className="text-4xl font-bold">{moduleName}</h1>
      </div>

      {/* Module Schedule */}
      {moduleData.length > 0 && (
        <div className="flex flex-col items-center gap-3 rounded-xl p-4 mb-8">
          <h2 className="text-2xl font-semibold text-left text-gray-700">
            Schedule
          </h2>
          {moduleData.map((data, idx) => (
            <span
              key={idx}
              className="bg-green-100 text-green-800 px-4 py-2 rounded-full font-medium hover:bg-green-200 transition-colors"
            >
              {data.day} ({data.time})
            </span>
          ))}
        </div>
      )}

      {/* Attendance Section */}
      <div className="bg-white rounded-xl shadow-md mb-10 p-6">
        <Attendance day={day} timeSlots={timeSlots} />
      </div>
    </div>
  );
};

export default ModuleDetails;
