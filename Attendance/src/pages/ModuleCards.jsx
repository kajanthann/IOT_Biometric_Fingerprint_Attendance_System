import React, { useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import { motion } from "framer-motion";
import {
  BookOpen,
  Clock,
  Calendar,
  ArrowRight,
  Loader2,
} from "lucide-react";

const ModuleCards = () => {
  const { modules, loading } = useContext(AppContext);
  const navigate = useNavigate();

  // 🔥 Remove duplicate module names
  const uniqueModules = useMemo(() => {
    const map = new Map();
    modules.forEach((mod) => {
      if (!map.has(mod.name)) {
        map.set(mod.name, mod);
      }
    });
    return Array.from(map.values());
  }, [modules]);

  // Premium gradient themes
  const gradients = [
    "from-sky-500/30 to-indigo-500/30 border-sky-500/30",
    "from-emerald-500/30 to-teal-500/30 border-emerald-500/30",
    "from-amber-500/30 to-orange-500/30 border-amber-500/30",
    "from-rose-500/30 to-pink-500/30 border-rose-500/30",
    "from-purple-500/30 to-fuchsia-500/30 border-purple-500/30",
    "from-indigo-500/30 to-blue-500/30 border-indigo-500/30",
  ];

  return (
    <div className="min-h-screen bg-[#0f172a] p-4 md:p-15 relative overflow-hidden">
      {/* Glow Effect */}
      <div className="absolute -top-[300px] -right-[300px] w-[800px] h-[800px] bg-sky-900/10 rounded-full blur-[150px] pointer-events-none"></div>

      <div className="mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 flex flex-col items-center"
        >
          <h1 className="text-3xl md:text-5xl font-extrabold text-white text-center">
            Course{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-400">
              Modules
            </span>
          </h1>

          <p className="text-slate-400 mt-4 max-w-xl text-center">
            Select a module to view detailed attendance statistics and student
            participation.
          </p>
        </motion.div>

        {/* Loading */}
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
            <Loader2 className="w-12 h-12 text-sky-500 animate-spin" />
            <p className="text-slate-400 uppercase tracking-widest text-sm animate-pulse">
              Fetching Modules...
            </p>
          </div>
        ) : uniqueModules.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] gap-4 p-8 text-center bg-[#111827]/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl">
            <BookOpen size={28} className="text-slate-500" />
            <p className="text-slate-400 font-medium text-lg">
              No modules found.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {uniqueModules.map((mod, idx) => {
              const theme = gradients[idx % gradients.length];

              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05, type: "spring" }}
                  onClick={() =>
                    navigate(`/modules/${encodeURIComponent(mod.name)}`, {
                      state: { day: mod.day, time: mod.time },
                    })
                  }
                  className="relative group rounded-3xl p-6 cursor-pointer overflow-hidden shadow-xl border border-slate-700/50 backdrop-blur-md bg-[#111827]/70 transition-all duration-300 hover:scale-[1.02]"
                >
                  {/* 🔥 Visible Gradient Background */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${theme} opacity-30 group-hover:opacity-50 transition-all duration-500`}
                  ></div>

                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                      <div className="p-3 rounded-2xl bg-black/40 border border-slate-700/50 shadow-inner">
                        <BookOpen
                          size={22}
                          className="text-white transition-colors"
                        />
                      </div>

                      <ArrowRight
                        size={18}
                        className="text-slate-400 group-hover:text-white group-hover:translate-x-1 transition-all"
                      />
                    </div>

                    <h2 className="text-lg md:text-xl font-bold text-white mb-4 line-clamp-2">
                      {mod.name}
                    </h2>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-slate-300">
                        <Calendar size={14} className="text-sky-400/70" />
                        {mod.day}
                      </div>

                      <div className="flex items-center gap-2 text-slate-300">
                        <Clock size={14} className="text-indigo-400/70" />
                        {mod.time}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ModuleCards;