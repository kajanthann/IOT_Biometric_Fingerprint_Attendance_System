import React, { useContext } from "react";
import { AppContext } from "../context/AppContext";

const TimeTable = () => {
  const { data, loading, darkMode } = useContext(AppContext);
  const primaryColor = "#01996f";

  // Using strict dark mode classes since the AppContext now enforces dark mode globally
  const bg = "bg-[#0f172a]";
  const textColor = "text-gray-100";
  const rowBg = (idx) => (idx % 2 === 0 ? "bg-gray-800/60" : "bg-gray-800/30");
  const borderColor = "border-gray-700/50";

  return (
    <div
      className={`px-4 sm:px-8 lg:px-16 mx-auto py-8 ${bg} ${textColor} min-h-screen relative`}
    >
      {/* Subtle background glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-sky-900/5 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Title */}
      <h1 className="text-xl md:text-3xl font-extrabold mb-8 text-center tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-400 z-10">
  Semester 5 CSE Time Table
</h1>

      {/* Loading Spinner */}
      {loading ? (
        <div className="flex justify-center items-center min-h-[300px] relative z-10">
          <div
            className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-t-transparent"
            style={{ borderColor: "#38bdf8" }} // Using sky-400 for spinner
          ></div>
        </div>
      ) : data.length <= 1 ? (
        <p className={`text-slate-400 text-center italic relative z-10 mt-10`}>
          No timetable data found.
        </p>
      ) : (
        <div className="overflow-x-auto relative z-10 border border-sky-700 rounded-2xl">
          <table className="w-full border-collapse shadow-2xl rounded-xl overflow-hidden text-sm md:text-base bg-black/20 border border-slate-700/50 backdrop-blur-sm">
            <tbody>
              {data.map((row, idx) => (
                <tr
                  key={idx}
                  className={`transition-colors duration-200 ${
                    idx === 0
                      ? "bg-[#111827] text-sky-400 font-bold uppercase tracking-wider text-xs" // Header row styling
                      : `${rowBg(idx - 1)} hover:bg-slate-700/50` // Data row styling
                  }`}
                >
                  {Object.values(row).map((cell, cellIdx) => (
                    <td
                      key={cellIdx}
                      className={`px-4 py-3 md:py-4 border ${borderColor} text-center ${
                        idx === 0
                          ? "border-b border-sky-500/30 font-semibold" // Header cells
                          : cellIdx === 0
                            ? "text-slate-400 font-medium bg-[#111827]/40" // Time column
                            : "text-slate-200" // Normal data cells
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
