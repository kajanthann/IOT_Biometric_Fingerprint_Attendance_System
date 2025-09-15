import React, { useContext, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { AppContext } from "../context/AppContext";

const Header = ({ token, setToken }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { espStatus, lastSeen } = useContext(AppContext);

  const handleLogout = () => {
    setToken("");
  };

  // Format lastSeen nicely
  const formatLastSeen = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  return (
    <header className="bg-[#02c986] text-white">
      <div className="flex justify-between items-center px-4 py-3 mx-auto">
        {/* Logo */}
        <NavLink to={"/home"}>
          <div className="text-4xl flex items-center cursor-pointer relative">
            F <span>O</span>C
            <span className="text-black text-xs ml-[-12px] mt-[2px] align-middle">Attendance</span>

            {/* LED Status */}
            {token && <span
              className={`w-3.5 h-3.5 border-2 rounded-full ml-2 mt-2 align-middle ${
                espStatus === "ONLINE" ? "bg-[#00ff88] animate-pulse" : "bg-[#ff5c5c]"
              }`}
            ></span>}

            {/* Last Seen */}
            {token && espStatus === "OFFLINE" && lastSeen && (
              <span className="text-[10px] text-black ml-1 bg-[#e0f9f0] rounded-full px-1 py-[2px] mt-2">
                Last Seen: {formatLastSeen(lastSeen)}
              </span>
            )}
            <Link to={token ? "/dashboard" : "/login"} className={token ? `text-2xl border px-2 ml-2 rounded-xl` : `hidden`}><i className="fa fa-bar-chart"></i></Link>
          </div>
        </NavLink>

        {/* Desktop Nav */}
        <nav className="hidden md:flex space-x-6 items-center font-medium relative">
          <NavLink to="/home" className={({ isActive }) => (isActive ? "font-bold underline" : "")}>
            Home
          </NavLink>
          <NavLink to="/students" className={({ isActive }) => (isActive ? "font-bold underline" : "")}>
            Students
          </NavLink>
          <NavLink to="/attendance" className={({ isActive }) => (isActive ? "font-bold underline" : "")}>
            Attendance
          </NavLink>
          <NavLink to="/modules" className={({ isActive }) => (isActive ? "font-bold underline" : "")}>
            Modules
          </NavLink>
          <NavLink to="/time-table" className={({ isActive }) => (isActive ? "font-bold underline" : "")}>
            TimeTable
          </NavLink>

          {!token ? (
            <NavLink to="/login" className="bg-indigo-500 px-3 py-1 rounded-lg">
              Login
            </NavLink>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 bg-indigo-600 text-left hover:bg-indigo-700 rounded-lg"
            >
              Logout
            </button>
          )}
        </nav>

        {/* Mobile Hamburger */}
        <div className="md:hidden flex items-center">
          <button onClick={() => setMenuOpen(!menuOpen)} className="focus:outline-none">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden text-center bg-[#02c986] px-4 pb-4 space-y-2">
          <NavLink to="/home" className="block py-2 text-white" onClick={() => setMenuOpen(false)}>
            Home
          </NavLink>
          <NavLink to="/students" className="block py-2 text-white" onClick={() => setMenuOpen(false)}>
            Students
          </NavLink>
          <NavLink to="/attendance" className="block py-2 text-white" onClick={() => setMenuOpen(false)}>
            Attendance
          </NavLink>
          <NavLink to="/modules" className="block py-2 text-white" onClick={() => setMenuOpen(false)}>
            Modules
          </NavLink>
          <NavLink to="/time-table" className="block py-2 text-white" onClick={() => setMenuOpen(false)}>
            TimeTable
          </NavLink>

          {!token ? (
            <NavLink to="/login" className="block py-2 text-white" onClick={() => setMenuOpen(false)}>
              Login
            </NavLink>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full text-left py-2 text-white hover:bg-[#029c72] rounded"
            >
              Logout
            </button>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;
