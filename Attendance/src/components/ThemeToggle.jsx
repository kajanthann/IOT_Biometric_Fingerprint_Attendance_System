import React, { useState, useEffect } from "react";

const ThemeToggle = () => {
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("theme") === "dark"
  );

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  return (
    <button
      onClick={() => setDarkMode(!darkMode)}
      className={`relative w-28 h-12 rounded-full transition-all duration-700 shadow-inner overflow-hidden ${
        darkMode ? "bg-[#0a1a2f]" : "bg-gradient-to-r from-sky-200 to-sky-400"
      }`}
    >
      {/* Sun & Moon */}
      <div
        className={`absolute top-1 left-1 w-10 h-10 rounded-full transition-all duration-700 ${
          darkMode
            ? "translate-x-16 bg-yellow-200 shadow-[0_0_20px_5px_rgba(255,255,200,0.4)]"
            : "bg-yellow-400 shadow-[0_0_20px_5px_rgba(255,255,0,0.5)]"
        }`}
      ></div>

      {/* Clouds (Day mode only) */}
      {!darkMode && (
        <div className="absolute flex space-x-2 top-3 left-14 transition-opacity duration-700">
          <div className="w-6 h-3 bg-white rounded-full opacity-80"></div>
          <div className="w-4 h-2 bg-white rounded-full opacity-70 mt-1"></div>
        </div>
      )}

      {/* Stars (Night mode only) */}
      {darkMode && (
        <div className="absolute inset-0">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full opacity-70"
              style={{
                top: `${Math.random() * 80}%`,
                left: `${Math.random() * 90}%`,
              }}
            ></div>
          ))}
        </div>
      )}
    </button>
  );
};

export default ThemeToggle;
