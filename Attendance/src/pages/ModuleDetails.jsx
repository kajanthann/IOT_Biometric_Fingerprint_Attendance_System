import React, { useContext } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import Attendance from "./Attendance";
import { AppContext } from "../context/AppContext";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Calendar,
  Users,
  Loader2,
} from "lucide-react";

// Parse module time string into slots: "8.00 - 10.00, 13.00 - 15.00"
const parseTimeSlots = (timeStr) => {
  if (!timeStr) return [];
  return timeStr.split(",").map((slot) => {
    const [start, end] = slot.split("-").map((t) => t.trim().replace(".", ":"));
    return { start, end };
  });
};

const ModuleDetails = () => {
  const { moduleName } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { day, time } = location.state || {};

  const { modules, loadingModules } = useContext(AppContext);
  const moduleData = modules?.filter((m) => m.name === moduleName) || [];
  const timeSlots = parseTimeSlots(time); // Array of { start, end }

  if (loadingModules) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex flex-col justify-center items-center gap-4">
        <Loader2 className="w-12 h-12 text-sky-500 animate-spin" />
        <p className="text-slate-400 font-medium uppercase tracking-widest text-sm animate-pulse">
          Loading Details...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] p-4 sm:p-8 lg:p-12 font-sans relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-sky-900/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Navigation back */}
        <button
          onClick={() => navigate("/modules")}
          className="group flex items-center gap-2 text-slate-400 hover:text-sky-400 font-medium transition-colors mb-8"
        >
          <ArrowLeft
            size={20}
            className="group-hover:-translate-x-1 transition-transform"
          />
          Back to Modules
        </button>

        {/* Module Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#111827]/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 mb-10 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-sky-500 to-indigo-500"></div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Left Section */}
            <div className="flex items-start sm:items-center gap-4 w-full lg:w-auto">
              {/* Responsive Icon */}
              <div className="p-3 sm:p-4 bg-sky-500/10 border border-sky-500/20 rounded-2xl text-sky-400">
                <BookOpen className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>

              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl md:text-3xl font-semibold text-white tracking-tight mb-1 break-words">
                  {moduleName}
                </h1>

                <p className="text-slate-400 text-xs sm:text-sm flex items-center gap-2">
                  <Users size={14} />
                  Module specific attendance records
                </p>
              </div>
            </div>

            {/* Schedule Section */}
            {moduleData.length > 0 && (
              <div className="w-full lg:w-auto">
                <div className="flex items-center gap-3 overflow-x-auto lg:overflow-visible bg-black/40 pl-2 rounded-lg border border-slate-700/50 scrollbar-hide">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 whitespace-nowrap">
                    Schedule:
                  </h2>

                  {moduleData.map((data, idx) => (
                    <span
                      key={idx}
                      className="flex-shrink-0 flex items-center gap-2 text-xs sm:text-sm px-3 sm:px-4 py-1 rounded-lg font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 whitespace-nowrap"
                    >
                      <Calendar size={14} className="text-indigo-400/70" />
                      {data.day}
                      <Clock size={14} className="ml-1 text-sky-400/70" />
                      {data.time}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Attendance Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#111827]/80 backdrop-blur-xl shadow-2xl rounded-3xl border border-slate-700/50"
        >
          <div className="flex items-center px-8 pt-4 gap-3">
            <div className=" bg-emerald-500/10 rounded-lg text-emerald-400">
              <Users size={24} />
            </div>
            <h2 className="text-2xl font-bold tracking-wide text-white">
              Attendance
            </h2>
          </div>

          <div className="">
            <Attendance day={day} timeSlots={timeSlots} />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ModuleDetails;
