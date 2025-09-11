import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../context/AppContext";

const TimeTable = () => {

  const { data, loading} = useContext(AppContext);

  return (
    <div className="container mx-auto p-6 mb-5">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
        Semester 5 CSE Time Table
      </h1>

      {loading ? (
        <div className="flex justify-center items-center min-h-[300px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4" style={{ colo: '#02c986' }}></div>
        </div>
      ) : data.length === 0 ? (
        <p className="text-center text-gray-500 italic">No timetable data found.</p>
      ) : (
        <div className="overflow-x-auto border rounded-lg shadow-lg">
          <table className="min-w-full border-collapse border border-gray-300 text-center">
            <tbody>
              {data.slice(1).map((row, idx) => (   // <-- skip first row
                <tr
                  key={idx}
                  className={`hover:bg-gray-100 ${idx % 2 === 0 ? "bg-gray-50" : "bg-white"}`}
                >
                  {Object.values(row).map((cell, cellIdx) => (
                    <td
                      key={cellIdx}
                      className="px-4 py-2 border border-gray-300 text-gray-800"
                    >
                      {cell}
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
