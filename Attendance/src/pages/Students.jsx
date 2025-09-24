// src/pages/Students.jsx
import React, { useContext, useState } from "react";
import { AppContext } from "../context/AppContext";
import RegisterStudent from "../components/RegisterStudent";

const ADMIN_EMAIL = "smarfingeriot32@gmail.com";

const Students = ({ token, adminEmail }) => {
  const { students, loading } = useContext(AppContext);
  const [showRegister, setShowRegister] = useState(false);

  const isAdmin = token && adminEmail === ADMIN_EMAIL;

  const deleteStudent = () => {
    // Handle student deletion
  };

  return (
    <div className="p-7 md:px-15">
      <div className="flex flex-column justify-between items-center mt-4 mb-6">
        <h2 className="text-2xl font-bold my-4 md:mb-0">Student Details</h2>
        <div>
          {/* Register button (Admin only) */}
          {isAdmin && (
            <button
              onClick={() => setShowRegister(true)}
              className="flex items-center gap-2 px-4 md:px-5 py-2.5 bg-[#01996f] text-white font-medium rounded-lg shadow-md hover:bg-green-700 hover:shadow-lg transition-all duration-200"
            >
              <i className="fa fa-user-plus"></i>
              <span className="hidden md:inline">Reg Student</span>
            </button>
          )}
        </div>
      </div>

      {/* Popup modal for RegisterStudent */}
      {showRegister && (
        <div className="fixed inset-0 flex items-center p-2 justify-center bg-opacity-30 backdrop-blur-sm z-50">
          <div className="bg-white rounded-lg shadow-lg md:p-6 w-full max-w-4xl relative border border-green-400">
            {/* Close button */}
            <button
              onClick={() => setShowRegister(false)}
              className="absolute top-2 right-2 text-xl font-bold text-gray-600 hover:text-black"
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
        <div className="overflow-x-auto shadow-md ">
          <table className="min-w-full border border-gray-200 text-center">
            <thead className="bg-slate-200">
              <tr>
                <th className="py-2 px-2 md:px-4 border">#</th>
                <th className="py-2 px-2 md:px-4 border">ID</th>
                <th className="py-2 px-2 md:px-4 border">Fingerprint ID</th>
                <th className="py-2 px-2 md:px-4 border">Name</th>
                <th className="py-2 px-2 md:px-4 border">RegNum</th>
                <th className="py-2 px-2 md:px-4 border">Action</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, index) => (
                <tr
                  key={student.indexNum}
                  className="hover:bg-gray-100 transition-colors"
                >
                  <td className="py-1 md:py-2 px-2 md:px-4 border">
                    {index + 1}
                  </td>
                  <td className="py-1 md:py-2 px-2 md:px-4 border">
                    {student.indexNum}
                  </td>
                  <td className="py-1 md:py-2 px-2 md:px-4 border">
                    {"FID_156" + student.fingerprintId}
                  </td>
                  <td className="py-1 md:py-2 px-2 md:px-4 border">
                    {student.name}
                  </td>
                  <td className="py-1 md:py-2 px-2 md:px-4 border">
                    {student.regNum}
                  </td>
                  <td className="py-1 md:py-2 px-2 md:px-4 border">
                    <div className="flex gap-2 justify-center">
                      <div className="bg-yellow-300 px-1 rounded border border-gray-400 flex justify-center cursor-pointer items-center">
                        <i className="fa fa-envelope-o"></i>
                      </div>
                      <div className="bg-rose-100 px-2 text-red-700 rounded border border-gray-400 cursor-pointer flex justify-center items-center">
                        X
                      </div>
                    </div>
                  </td>
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
