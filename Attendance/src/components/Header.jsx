import React, { useContext, useState } from "react";
import { NavLink } from "react-router-dom";
import { AppContext } from "../context/AppContext";

const Header = ({ token, setToken }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { espStatus, darkMode, setDarkMode } = useContext(AppContext);

  const handleLogout = () => setToken("");

  const navLinks = ["/home", "/students", "/attendance", "/modules", "/time-table"];

  return (
    <header className={`shadow-lg border-b ${
      darkMode ? "bg-gray-900 text-gray-200 border-gray-700" : "bg-[#01996f] text-white border-[#01996f]"
    }`}>
      <div className="flex justify-between items-center px-4 py-3 mx-auto">

        {/* Logo */}
        <NavLink to="/home">
          <div className="text-4xl flex items-center cursor-pointer relative">
            F<span>O</span>C
            <span className={`text-xs ml-[-12px] mt-[2px] align-middle ${darkMode ? "text-gray-400" : "text-white"}`}>
              Attendance
            </span>

            {/* LED Status */}
            {token && (
              <span
                className={`w-3.5 h-3.5 border-2 rounded-full ml-2 mt-2 align-middle ${
                  espStatus === "ONLINE" ? "animate-pulse" : ""
                }`}
                style={{
                  backgroundColor: espStatus === "ONLINE" ? "#00ff88" : "#ff5c5c",
                  boxShadow: espStatus === "ONLINE" ? "0 0 8px #01996f" : "0 0 8px red"
                }}
              />
            )}
          </div>
        </NavLink>

<button
  onClick={() => setDarkMode(!darkMode)}
  className={`relative w-20 h-8 rounded-full transition-all duration-700 shadow-inner overflow-hidden ${
    darkMode ? "bg-[#0a1a2f]" : "bg-gradient-to-r from-sky-200 to-sky-400"
  }`}
>
  {/* Clouds (Day mode) - behind the sun */}
  {!darkMode && (
    <div className="absolute top-1 left-5 flex space-x-1 transition-opacity duration-700 z-0">
      <div className="w-6 h-3 bg-white rounded-full opacity-80"></div>
      <div className="w-4 h-2 bg-white rounded-full opacity-70 mt-3"></div>
    </div>
  )}

  {/* Sun & Moon */}
  <div
    className={`absolute top-1 left-1 w-6 h-6 rounded-full transition-all duration-700 z-10 ${
      darkMode
        ? "translate-x-12 bg-yellow-200 shadow-[0_0_15px_5px_rgba(255,255,200,0.4)]"
        : "bg-yellow-400 shadow-[0_0_15px_5px_rgba(255,255,0,0.5)]"
    }`}
  ></div>

  {/* Stars (Night mode only) */}
  {darkMode && (
    <div className="absolute inset-0 z-0">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-white rounded-full opacity-70"
          style={{
            top: `${Math.random() * 70 + 10}%`,
            left: `${Math.random() * 80 + 5}%`,
          }}
        ></div>
      ))}
    </div>
  )}
</button>

        {/* Desktop Nav */}
        <nav className="hidden md:flex space-x-3 lg:space-x-6 items-center font-medium">
          {navLinks.map((path) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `hover:text-white ${
                  isActive
                    ? "font-bold underline"
                    : darkMode
                    ? "text-gray-300"
                    : "text-white/80"
                }`
              }
            >
              {path.replace("/", "").replace("-", " ").toUpperCase() || "HOME"}
            </NavLink>
          ))}

          {!token ? (
            <NavLink
              to="/login"
              className={`px-3 py-1 rounded-lg ${
                darkMode ? "bg-[#01996f] text-gray-900 hover:bg-[#00e68a]" : "bg-white/20 text-white hover:bg-white/30"
              }`}
            >
              Login
            </NavLink>
          ) : (
            <button
              onClick={handleLogout}
              className={`px-3 py-1 rounded-2xl ${
                darkMode ? "bg-[#01996f] text-gray-900 hover:bg-[#00e68a]" : "bg-white/20 text-white hover:bg-white/30"
              }`}
            >
              Logout
            </button>
          )}
        </nav>

        {/* Mobile Hamburger */}
        <div className="md:hidden flex items-center">
          <button onClick={() => setMenuOpen(!menuOpen)} className="focus:outline-none">
            <svg className={`w-6 h-6 ${darkMode ? "text-gray-200" : "text-white"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <div className={`md:hidden px-4 pb-4 space-y-2 ${
          darkMode ? "bg-gray-900 text-gray-200" : "bg-[#01996f] text-white"
        }`}>
          {navLinks.map((path) => (
            <NavLink
              key={path}
              to={path}
              onClick={() => setMenuOpen(false)}
              className="block py-2 hover:text-white/80"
            >
              {path.replace("/", "").replace("-", " ").toUpperCase() || "HOME"}
            </NavLink>
          ))}

          {!token ? (
            <NavLink
              to="/login"
              onClick={() => setMenuOpen(false)}
              className="block py-2 bg-white/20 text-white rounded-lg hover:bg-white/30"
            >
              Login
            </NavLink>
          ) : (
            <button
              onClick={handleLogout}
              className="block py-2 bg-white/20 text-white rounded-2xl hover:bg-white/30 w-full"
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
