import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import { motion } from "framer-motion";
import { BookOpen, Clock, Calendar, ArrowRight, Loader2 } from "lucide-react";

const ModuleCards = () => {
  const { modules, loading } = useContext(AppContext);
  const navigate = useNavigate();

  // Premium gradient combinations
  const gradients = [
    "from-sky-500/20 to-indigo-500/20 border-sky-500/30 text-sky-400",
    "from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-400",
    "from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-400",
    "from-rose-500/20 to-pink-500/20 border-rose-500/30 text-rose-400",
    "from-purple-500/20 to-fuchsia-500/20 border-purple-500/30 text-purple-400",
    "from-indigo-500/20 to-blue-500/20 border-indigo-500/30 text-indigo-400",
  ];

  return (
    <div className="min-h-screen bg-[#0f172a] p-4 sm:p-10 font-sans relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute -top-[300px] -right-[300px] w-[800px] h-[800px] bg-sky-900/10 rounded-full blur-[150px] pointer-events-none"></div>

      <div className="mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 flex flex-col items-center"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold tracking-widest uppercase mb-4">
            <BookOpen size={14} />
            Academic Courses
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight text-center">
            Course{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-400">
              Modules
            </span>
          </h1>
          <p className="text-slate-400 mt-4 max-w-xl text-center">
            Select a specific module to view detailed attendance statistics and
            student participations.
          </p>
        </motion.div>

        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
            <Loader2 className="w-12 h-12 text-sky-500 animate-spin" />
            <p className="text-slate-400 font-medium uppercase tracking-widest text-sm animate-pulse">
              Fetching Modules...
            </p>
          </div>
        ) : modules.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] gap-4 p-8 text-center bg-[#111827]/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl">
            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 border border-slate-700">
              <BookOpen size={24} />
            </div>
            <p className="text-slate-400 font-medium text-lg">
              No modules found.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {modules.map((mod, idx) => {
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
                  className={`relative group bg-[#111827]/60 backdrop-blur-md rounded-3xl p-6 border transition-all duration-300 cursor-pointer overflow-hidden shadow-xl
                    bg-gradient-to-br border-slate-700/50 hover:border-sky-500/50 hover:shadow-sky-900/20`}
                >
                  {/* Hover ambient background */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${theme} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                  ></div>

                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                      <div
                        className={`p-3 rounded-2xl bg-black/40 border border-slate-700/50 shadow-inner group-hover:scale-110 transition-transform`}
                      >
                        <BookOpen
                          size={24}
                          className="text-slate-300 group-hover:text-white transition-colors"
                        />
                      </div>
                      <ArrowRight
                        size={20}
                        className="text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all"
                      />
                    </div>

                    <h2 className="text-xl font-bold text-white mb-4 line-clamp-2 leading-snug">
                      {mod.name}
                    </h2>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-400">
                        <Calendar size={14} className="text-sky-400/70" />
                        <span className="text-slate-300">{mod.day}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-400">
                        <Clock size={14} className="text-indigo-400/70" />
                        <span className="text-slate-300">{mod.time}</span>
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
