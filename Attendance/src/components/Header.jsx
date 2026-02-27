import React, { useContext, useState } from "react";
import { NavLink } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LogIn, LogOut } from "lucide-react";

const Header = ({ token, setToken }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { espStatus } = useContext(AppContext);

  const handleLogout = () => setToken("");

  const navLinks = [
    { name: "Students", path: "/students" },
    { name: "Attendance", path: "/attendance" },
    { name: "Modules", path: "/modules" },
    { name: "Time Table", path: "/time-table" },
  ];

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#0b1120]/80 border-b border-sky-500/20 shadow-[0_4px_30px_rgba(14,165,233,0.1)]">
      <div className="flex justify-between items-center px-6 py-2 max-w-7xl mx-auto">
        {/* Logo */}
        <NavLink to="/home">
          <motion.div
            className="text-5xl font-semibold flex items-center cursor-pointer relative tracking-tight text-white"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            F<span className="text-sky-500">O</span>C
            <span className="text-xs ml-[-10px] mt-1 align-middle text-slate-400 uppercase tracking-widest font-semibold">
              Attendance
            </span>
            {/* LED Status */}
            {token && (
              <motion.span
                animate={
                  espStatus === "ONLINE"
                    ? { scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }
                    : {}
                }
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="w-3.5 h-3.5 border-2 border-[#0b1120] rounded-full ml-1 mt-1.5"
                style={{
                  backgroundColor:
                    espStatus === "ONLINE" ? "#10b981" : "#ef4444",
                  boxShadow:
                    espStatus === "ONLINE"
                      ? "0 0 12px #10b981"
                      : "0 0 12px #ef4444",
                }}
                title={`ESP32 is ${espStatus}`}
              />
            )}
          </motion.div>
        </NavLink>

        {/* Desktop Nav */}
        <nav className="hidden md:flex space-x-1 lg:space-x-2 items-center font-medium">
          {navLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                `px-4 py-2 rounded-full transition-all duration-300 ${
                  isActive
                    ? "bg-sky-500/10 text-sky-400 shadow-[inset_0_0_10px_rgba(56,189,248,0.2)]"
                    : "text-white hover:bg-white/5"
                }`
              }
            >
              {link.name}
            </NavLink>
          ))}

          <div className="w-px h-6 bg-slate-700/50 mx-2"></div>

          {!token ? (
            <NavLink
              to="/login"
              className="flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-semibold hover:shadow-[0_0_20px_rgba(56,189,248,0.4)] transition-all duration-300"
            >
              <LogIn size={18} />
              Login
            </NavLink>
          ) : (
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-5 py-2 rounded-full border border-rose-500/50 text-rose-400 font-semibold hover:bg-rose-500/10 hover:shadow-[0_0_15px_rgba(244,63,94,0.3)] transition-all duration-300"
            >
              <LogOut size={18} />
              Logout
            </button>
          )}
        </nav>

        {/* Mobile Hamburger */}
        <div className="md:hidden flex items-center">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-slate-300 hover:text-white transition-colors p-2"
          >
            {menuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden bg-[#0f172a] border-b border-sky-500/20"
          >
            <div className="px-6 py-4 space-y-2 flex flex-col">
              {navLinks.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `block py-3 px-4 rounded-xl transition-all ${
                      isActive
                        ? "bg-sky-500/20 text-sky-400"
                        : "text-slate-300 hover:bg-white/5 hover:text-white"
                    }`
                  }
                >
                  {link.name}
                </NavLink>
              ))}

              <div className="h-px w-full bg-slate-700/50 my-2"></div>

              {!token ? (
                <NavLink
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-center gap-2 py-3 mt-2 rounded-xl bg-sky-600 text-white font-semibold shadow-lg shadow-sky-900/50"
                >
                  <LogIn size={20} />
                  Login
                </NavLink>
              ) : (
                <button
                  onClick={() => {
                    handleLogout();
                    setMenuOpen(false);
                  }}
                  className="flex items-center justify-center gap-2 py-3 mt-2 rounded-xl border border-rose-500/50 text-rose-400 font-semibold hover:bg-rose-500/10"
                >
                  <LogOut size={20} />
                  Logout
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
