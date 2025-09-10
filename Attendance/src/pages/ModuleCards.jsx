import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";

const ModuleCards = () => {
  const { modules, loading } = useContext(AppContext);
  const navigate = useNavigate();

  // Predefined colors (can customize)
  const colors = [
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

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Modules List</h1>
      {loading ? (
        <div className="flex justify-center items-center min-h-[300px]">
          <div
            className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4"
            style={{ color: "#02c986" }}
          ></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((mod, idx) => {
            const randomColor =
              colors[Math.floor(Math.random() * colors.length)];
            return (
              <div
                key={idx}
                className={`border rounded-lg shadow p-4 text-center cursor-pointer hover:bg-green-50 ${randomColor} bg-opacity-70`}
                onClick={() =>
                  navigate(`/modules/${encodeURIComponent(mod.name)}`, {
                    state: { day: mod.day, time: mod.time },
                  })
                }
              >
                <div className="font-semibold">{mod.name}</div>
                <div className="text-gray-600 mt-1">
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
