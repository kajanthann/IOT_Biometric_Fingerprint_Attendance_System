import React, { useEffect, useState } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Students from "./pages/Students";
import Attendance from "./pages/Attendance";
import TimeTable from "./pages/TimeTable";
import ModuleCards from "./pages/ModuleCards";
import ModuleDetails from "./pages/ModuleDetails";
import Login from "./pages/Login";
import Home from "./pages/Home";

const ADMIN_EMAIL = "smarfingeriot32@gmail.com";

const App = () => {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [adminEmail, setAdminEmail] = useState(localStorage.getItem("adminEmail") || "");

  useEffect(() => {
    if (token && adminEmail) {
      localStorage.setItem("token", token);
      localStorage.setItem("adminEmail", adminEmail);
    } else {
      localStorage.removeItem("token");
      localStorage.removeItem("adminEmail");
    }
  }, [token, adminEmail]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header token={token} setToken={setToken} adminEmail={adminEmail} />
      <div className="flex-1">
        <Routes>
          

          {/* Login */}
          <Route
            path="/login"
            element={
              !token ? (
                <Login setToken={setToken} setAdminEmail={setAdminEmail} />
              ) : (
                <Navigate to="/home" />
              )
            }
          />

          {/* Public pages */}
          <Route path="/home" element={<Home />} />
          <Route path="/students" element={<Students token={token} adminEmail={adminEmail} />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/time-table" element={<TimeTable />} />
          <Route path="/modules" element={<ModuleCards />} />
          <Route path="/modules/:moduleName" element={<ModuleDetails />} />

          {/* Default redirect */}
          <Route path="*" element={<Navigate to={"/home"} />} />
        </Routes>
      </div>
      <Footer />
    </div>
  );
};

export default App;
