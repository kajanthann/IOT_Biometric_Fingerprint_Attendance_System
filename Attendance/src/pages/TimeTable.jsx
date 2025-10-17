import React, { useContext } from "react";
import { AppContext } from "../context/AppContext";

const TimeTable = () => {
  const { data, loading, darkMode } = useContext(AppContext);
  const primaryColor = "#01996f";

  const bg = darkMode ? "bg-gray-900" : "bg-white";
  const textColor = darkMode ? "text-gray-100" : "text-black";
  const rowBg = (idx) =>
    darkMode
      ? idx % 2 === 0
        ? "bg-gray-800"
        : "bg-gray-700"
      : idx % 2 === 0
      ? "bg-gray-100"
      : "bg-slate-200";

  return (
    <div className={`px-4 sm:px-8 lg:px-16 mx-auto py-8 ${bg} ${textColor} min-h-screen`}>
      {/* Title */}
      <h1 className="text-xl md:text-4xl font-bold mb-6 text-center" style={{ color: primaryColor }}>
        Semester 5 CSE Time Table
      </h1>

      {/* Loading Spinner */}
      {loading ? (
        <div className="flex justify-center items-center min-h-[300px]">
          <div
            className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-t-transparent"
            style={{ borderColor: primaryColor }}
          ></div>
        </div>
      ) : data.length <= 1 ? (
        <p className={`${darkMode ? "text-gray-400" : "text-gray-600"} text-center italic`}>
          No timetable data found.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse shadow-lg rounded-lg overflow-hidden text-sm md:text-base">
            <tbody>
              {data.slice(1).map((row, idx) => (
                <tr
                  key={idx}
                  className={`transition ${rowBg(idx)} ${darkMode ? 'hover:bg-gray-950' : 'hover:bg-gray-300'}`}
                >
                  {Object.values(row).map((cell, cellIdx) => (
                    <td
                      key={cellIdx}
                      className={`px-4 py-3 border border-gray-600 text-center ${
                        darkMode ? "text-gray-200" : "text-black"
                      }`}
                    >
                      {cell || "-"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TimeTable;
