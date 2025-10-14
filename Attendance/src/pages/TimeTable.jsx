import React, { useContext } from "react";
import { AppContext } from "../context/AppContext";

const TimeTable = () => {
  const { data, loading } = useContext(AppContext);

  return (
    <div className="container mx-auto px-4 md:px-8 py-8">
      {/* Title */}
      <h1 className="text-xl md:text-4xl font-bold mb-6 text-center text-[#01996f]">
        Semester 5 CSE Time Table
      </h1>

      {/* Loading Spinner */}
      {loading ? (
        <div className="flex justify-center items-center min-h-[300px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[#02c986]"></div>
        </div>
      ) : data.length <= 1 ? (
        <p className="text-center text-gray-500 italic">
          No timetable data found.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white shadow-lg rounded-lg overflow-hidden text-sm md:text-base">
            <tbody>
              {data.slice(1).map((row, idx) => (
                <tr
                  key={idx}
                  className={`hover:bg-green-50 transition ${
                    idx % 2 === 0 ? "bg-gray-50" : "bg-white"
                  }`}
                >
                  {Object.values(row).map((cell, cellIdx) => (
                    <td
                      key={cellIdx}
                      className="px-4 py-3 border border-gray-200 text-gray-700 text-center"
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
