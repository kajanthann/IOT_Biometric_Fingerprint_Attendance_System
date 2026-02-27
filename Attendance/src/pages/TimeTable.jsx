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
      className={`px-4 sm:px-8 lg:px-16 mx-auto py-8 ${bg} ${textColor} relative`}
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
        <div className="overflow-x-auto relative z-10 rounded-xl border border-slate-700/50 shadow-xl">
          <table className="w-full border-collapse text-xs md:text-sm bg-slate-900/40 backdrop-blur-md">
            <tbody>
              {data.slice(1).map((row, idx) => (
                <tr
                  key={idx}
                  className={`transition-colors duration-200 ${
                    idx === 0
                      ? "bg-slate-800 text-sky-400 font-semibold uppercase text-[10px] md:text-xs tracking-wider"
                      : "hover:bg-slate-800/60"
                  }`}
                >
                  {Object.values(row).map((cell, cellIdx) => (
                    <td
                      key={cellIdx}
                      className={`
                px-2 py-3 md:px-4 md:py-4 
                border border-slate-700/50 
                text-center align-middle
                ${
                  cellIdx === 0
                    ? "sticky left-[-2px] bg-slate-900 font-semibold text-sky-300"
                    : "text-slate-300"
                }
              `}
                    >
                      <div className="min-w-[90px] md:min-w-[120px] break-words">
                        {cell || "-"}
                      </div>
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
