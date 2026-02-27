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
          <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-sky-500 to-indigo-500"></div>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pl-4">
            <div className="flex items-center gap-5 border-l-0 pl-0">
              <div className="hidden sm:flex p-4 bg-sky-500/10 border border-sky-500/20 rounded-2xl text-sky-400">
                <BookOpen size={32} />
              </div>
              <div>
                <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight mb-2">
                  {moduleName}
                </h1>
                <p className="text-slate-400 font-medium flex items-center gap-2">
                  <Users size={16} /> Module specific attendance records
                </p>
              </div>
            </div>

            {/* Schedule Pills */}
            {moduleData.length > 0 && (
              <div className="flex flex-wrap items-center gap-3 bg-black/40 p-3 rounded-2xl border border-slate-700/50">
                <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 mr-2">
                  Schedule:
                </h2>
                {moduleData.map((data, idx) => (
                  <span
                    key={idx}
                    className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                  >
                    <Calendar size={14} className="text-indigo-400/70" />{" "}
                    {data.day}
                    <Clock size={14} className="ml-1 text-sky-400/70" />{" "}
                    {data.time}
                  </span>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Attendance Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#111827]/80 backdrop-blur-xl shadow-2xl rounded-3xl p-8 border border-slate-700/50"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
              <Users size={24} />
            </div>
            <h2 className="text-2xl font-bold tracking-wide text-white">
              Course Attendance
            </h2>
          </div>

          <div className="-mx-4 sm:mx-0">
            <Attendance day={day} timeSlots={timeSlots} />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ModuleDetails;
