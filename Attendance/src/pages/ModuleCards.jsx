import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";

const ModuleCards = () => {
  const { modules, loading, darkMode } = useContext(AppContext);
  const navigate = useNavigate();
  const primaryColor = "#01996f";

  // Light and dark theme card colors
  const lightColors = [
    "bg-green-200",
    "bg-blue-200",
    "bg-yellow-200",
    "bg-pink-200",
    "bg-purple-200",
    "bg-red-200",
    "bg-indigo-200",
    "bg-teal-200",
    "bg-orange-200",
    "bg-lime-200",
    "bg-cyan-200",
  ];

  const darkColors = [
    "bg-gray-800",
    "bg-gray-700",
    "bg-gray-900",
    "bg-gray-800/80",
    "bg-gray-700/80",
  ];

  const cardColors = darkMode ? darkColors : lightColors;
  const bg = darkMode ? "bg-gray-900" : "bg-white";
  const textColor = darkMode ? "text-gray-100" : "text-black";

  return (
    <div className={`mx-auto p-4 sm:px-8 lg:px-16 min-h-screen ${bg} ${textColor}`}>
      <h1 className={`text-3xl font-bold mb-6 text-center`} style={{ color: primaryColor }}>
        Modules List
      </h1>

      {loading ? (
        <div className="flex justify-center items-center min-h-[300px]">
          <div
            className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-t-transparent"
            style={{ borderColor: primaryColor }}
          ></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((mod, idx) => {
            const randomColor = cardColors[idx % cardColors.length]; // Cycle through colors
            const cardTextColor = darkMode ? "text-[#01996f]" : "text-black";

            return (
              <div
                key={idx}
                className={`${randomColor} border rounded-lg shadow p-4 text-center cursor-pointer hover:shadow-lg hover:border-[#01996f] transition-all duration-200`}
                onClick={() =>
                  navigate(`/modules/${encodeURIComponent(mod.name)}`, {
                    state: { day: mod.day, time: mod.time },
                  })
                }
              >
                <div className={`font-semibold ${cardTextColor}`}>{mod.name}</div>
                <div className={darkMode ? "text-gray-400 mt-1" : "text-gray-700 mt-1"}>
                  {mod.day} ({mod.time})
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ModuleCards;
