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
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#02c986] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Module Name */}
      <div className="bg-gradient-to-r from-[#02c986] to-[#3bb8ff] text-white rounded-2xl shadow-lg py-6 px-4 text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold">{moduleName}</h1>
        {/* Schedule */}
        {moduleData.length > 0 && (
          <div className=" flex gap-3 mt-4">
            <h2 className="text-xl md:text-2xl font-semibold text-gray-700">
              Schedule →
            </h2>
            <div className="flex flex-wrap gap-3">
              {moduleData.map((data, idx) => (
                <span
                  key={idx}
                  className="bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium hover:bg-green-200 transition-colors"
                >
                  {data.day} ({data.time})
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Attendance */}
      <div className="bg-white shadow-md rounded-xl p-6">
        <h2 className="text-xl md:text-2xl font-semibold text-gray-700 mb-4">
          Attendance
        </h2>
        <Attendance day={day} timeSlots={timeSlots} />
      </div>
    </div>
  );
};

export default ModuleDetails;
