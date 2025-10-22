import React, { useContext, useState } from "react";
import { AppContext } from "../context/AppContext";
import RegisterStudent from "../components/RegisterStudent";

const ADMIN_EMAIL = "smarfingeriot32@gmail.com";

const Students = ({ token, adminEmail }) => {
  const { students, loading, darkMode } = useContext(AppContext);
  const [showRegister, setShowRegister] = useState(false);

  const isAdmin = token && adminEmail === ADMIN_EMAIL;
  const primaryColor = "#01996f";

  // Theme-aware colors
  const bg = darkMode ? "bg-gray-900" : "bg-white";
  const textColor = darkMode ? "text-gray-100" : "text-black";
  const inputBg = darkMode ? "bg-gray-800" : "bg-white";
  const borderColor = darkMode ? "border-gray-700" : "border-gray-800";
  const hoverBg = darkMode ? "hover:bg-gray-700" : "hover:bg-gray-200";
  const tableHeaderBg = darkMode ? "bg-gray-800" : primaryColor;
  const tableHeaderText = darkMode ? "text-gray-100" : "text-white";

  const deleteStudent = () => {
    // Handle student deletion
  };

  return (
    <div className={`p-7 md:px-15 min-h-screen ${bg} ${textColor}`}>
      <div className="flex justify-between items-center mt-4 mb-6 gap-4 md:gap-0">
        <h2 className="text-2xl font-bold my-4 md:mb-0">Student Details</h2>
        <div>
          {/* Register button (Admin only) */}
          {isAdmin && (
            <button
              onClick={() => setShowRegister(true)}
              className={`flex items-center gap-2 px-4 md:px-5 py-2.5 font-medium rounded-lg shadow-md transition-all duration-200 ${bg === "bg-white" ? "text-white" : "text-white"} `}
              style={{
                backgroundColor: primaryColor,
              }}
            >
              <i className="fa fa-user-plus"></i>
              <span className="hidden md:inline">Reg Student</span>
            </button>
          )}
        </div>
      </div>

      {/* Popup modal for RegisterStudent */}
      {showRegister && (
        <div className="fixed inset-0 flex items-center p-4 pt-20 justify-center bg-opacity-50 backdrop-blur-sm z-50">
          <div
            className={`rounded-lg shadow-lg md:p-2  w-full max-w-4xl relative border ${borderColor} ${
              darkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            {/* Close button */}
            <button
              onClick={() => setShowRegister(false)}
              className="absolute top-2 right-2 text-xl font-bold text-gray-400 hover:text-black cursor-pointer"
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
            style={{ borderColor: primaryColor }}
          ></div>
        </div>
      ) : students.length === 0 ? (
        <p className="text-center text-gray-400 italic">No students found.</p>
      ) : (
        <div className={`overflow-x-auto shadow-md border rounded-lg ${borderColor}`}>
          <table className={`min-w-full text-center text-sm border-collapse ${textColor}`}>
            <thead className={`sticky top-0 ${tableHeaderBg} ${borderColor}`}>
              <tr>
                <th className={`py-2 px-2 md:px-4 border ${borderColor}`}>#</th>
                <th className={`py-2 px-2 md:px-4 border ${borderColor}`}>Fingerprint ID</th>
                <th className={`py-2 px-2 md:px-4 border ${borderColor}`}>Name</th>
                <th className={`py-2 px-2 md:px-4 border ${borderColor}`}>RegNum</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, index) => (
                <tr key={index} className={`${hoverBg} transition-colors`}>
                  <td className={`py-1 md:py-2 px-2 md:px-4 border ${borderColor}`}>{index + 1}</td>
                  <td className={`py-1 md:py-2 px-2 md:px-4 border ${borderColor}`}>{"FID_156" + student.fingerprintId}</td>
                  <td className={`py-1 md:py-2 px-2 md:px-4 border ${borderColor}`}>{student.name}</td>
                  <td className={`py-1 md:py-2 px-2 md:px-4 border ${borderColor}`}>{student.regNum}</td>
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
