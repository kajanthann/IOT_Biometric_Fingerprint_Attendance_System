// src/pages/Students.jsx
import React, { useContext, useState } from "react";
import { AppContext } from "../context/AppContext";
import RegisterStudent from "../components/RegisterStudent";

const Students = () => {
  const { students, loading } = useContext(AppContext);
  const [showRegister, setShowRegister] = useState(false);

  return (
    <div className="p-6">
      <div className="flex flex-column justify-between">
        <h2 className="text-2xl font-bold mb-6">Student Details</h2>

        {/* Register button */}
        <div className="mb-4">
          <button
            onClick={() => setShowRegister(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white font-medium rounded-lg shadow-md hover:bg-green-700 hover:shadow-lg transition-all duration-200"
          >
            <i className="fa fa-user-plus"></i>
            <span>Reg Student</span>
          </button>
        </div>
      </div>

      {/* Popup modal for RegisterStudent */}
      {showRegister && (
        <div className="fixed inset-0 flex items-center justify-center bg-opacity-40 backdrop-blur-xs z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-5xl relative border border-green-400">
            {/* Close button */}
            <button
              onClick={() => setShowRegister(false)}
              className="absolute top-2 text-xl font-bold right-2 text-gray-600 hover:text-black"
            >
              ✕
            </button>

            {/* Register form component */}
            <RegisterStudent onClose={() => setShowRegister(false)} />
          </div>
        </div>
      )}

      {/* Students table */}
      {loading ? (
        <div className="flex justify-center items-center min-h-[300px]">
          <div
            className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4"
            style={{ color: "#02c986" }}
          ></div>
        </div>
      ) : students.length === 0 ? (
        <p className="text-center text-gray-500 italic">No students found.</p>
      ) : (
        <div className="overflow-x-auto shadow-md rounded-lg">
          <table className="min-w-full border border-gray-200 text-center">
            <thead className="bg-green-600 text-white">
              <tr>
                <th className="py-2 px-4 border">#</th>
                <th className="py-2 px-4 border">ID</th>
                <th className="py-2 px-4 border">Fingerprint ID</th>
                <th className="py-2 px-4 border">Name</th>
                <th className="py-2 px-4 border">RegNum</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, index) => (
                <tr
                  key={student.indexNum}
                  className="hover:bg-gray-100 transition-colors"
                >
                  <td className="py-2 px-4 border">{index + 1}</td>
                  <td className="py-2 px-4 border">{student.indexNum}</td>
                  <td className="py-2 px-4 border">
                    {"FID_156" + student.fingerprintId}
                  </td>
                  <td className="py-2 px-4 border">{student.name}</td>
                  <td className="py-2 px-4 border">{student.regNum}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Students;
