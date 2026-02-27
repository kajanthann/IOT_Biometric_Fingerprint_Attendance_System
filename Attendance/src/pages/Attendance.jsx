import React, { useState, useEffect, useContext } from "react";
import { AppContext } from "../context/AppContext";
import { filterBySlots } from "../utils/attendanceUtils";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Search,
  Activity,
  List,
  Calculator,
  AlertCircle,
  Loader2,
} from "lucide-react";

const Attendance = ({ day, timeSlots = [] }) => {
  const { students, loading } = useContext(AppContext);
  const [search, setSearch] = useState("");
  const [attendanceFilter, setAttendanceFilter] = useState("all");
  const [view, setView] = useState("summary"); // "summary" | "raw"

  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [customPercent, setCustomPercent] = useState({});
  const [showTimesMap, setShowTimesMap] = useState({});

  const generateMonthDays = (year, month) => {
    const date = new Date(year, month - 1, 1);
    const days = [];
    while (date.getMonth() === month - 1) {
      const dayName = date.toLocaleString("en-US", { weekday: "short" });
      days.push({ date: new Date(date), dayName });
      date.setDate(date.getDate() + 1);
    }
    return days;
  };

  const [monthDays, setMonthDays] = useState(generateMonthDays(year, month));
  useEffect(() => setMonthDays(generateMonthDays(year, month)), [month, year]);

  const handlePrevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else setMonth(month - 1);
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else setMonth(month + 1);
  };

  const groupedStudents = () => {
    return students
      .map((student) => {
        if (!student.timestamps) return null;

        let filteredTimestamps = student.timestamps.filter(Boolean);
        if (timeSlots.length > 0)
          filteredTimestamps = filterBySlots(student.timestamps, timeSlots);

        const dailyAttendance = monthDays.map((dayObj) => {
          const dayDate = dayObj.date;
          if (dayDate > today) return "";

          const tsForDay = filteredTimestamps
            .map((ts) => new Date(ts))
            .filter(
              (d) =>
                d.getDate() === dayDate.getDate() &&
                d.getMonth() === dayDate.getMonth() &&
                d.getFullYear() === dayDate.getFullYear(),
            );

          if (tsForDay.length > 0) {
            const uniqueTimes = [
              ...new Set(
                tsForDay.map((d) =>
                  d.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                ),
              ),
            ];
            return `P (${uniqueTimes.join(", ")})`;
          } else {
            return "A";
          }
        });

        const presentCount = dailyAttendance.filter((a) =>
          a.startsWith("P"),
        ).length;
        const percentage = (
          (presentCount / dailyAttendance.filter((a) => a !== "").length) *
          100
        ).toFixed(2);

        return { ...student, dailyAttendance, percentage };
      })
      .filter(Boolean)
      .filter(
        (student) =>
          student.name?.toLowerCase().includes(search.toLowerCase()) ||
          student.indexNum?.toLowerCase().includes(search.toLowerCase()) ||
          student.regNum?.toLowerCase().includes(search.toLowerCase()),
      )
      .filter((student) => {
        if (attendanceFilter === "above80") return student.percentage >= 80;
        if (attendanceFilter === "below80") return student.percentage < 80;
        return true;
      });
  };

  const calculateCustomPercentage = () => {
    if (!startDate || !endDate) return;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const percentMap = {};
    groupedStudents().forEach((student) => {
      const countInRange = monthDays
        .map((day, idx) => ({
          date: day.date,
          status: student.dailyAttendance[idx],
        }))
        .filter((d) => d.date >= start && d.date <= end && d.status !== "");

      const presentCount = countInRange.filter((d) =>
        d.status.startsWith("P"),
      ).length;
      const totalCount = countInRange.length;
      percentMap[student.id] =
        totalCount === 0 ? 0 : ((presentCount / totalCount) * 100).toFixed(2);
    });
    setCustomPercent(percentMap);
    setShowDatePicker(false);
  };

  return (
    <div className="w-full relative min-h-[60vh] p-4 sm:p-10 font-sans">
      {/* View Toggle & Actions Bar */}
      <div className="flex flex-col xl:flex-row justify-between gap-4 mb-6">
        {/* Left Actions (Tabs) */}
        <div className="flex bg-black/40 p-1.5 rounded-xl border border-slate-700/50 w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setView("summary")}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
              view === "summary"
                ? "bg-sky-500/20 text-sky-400 shadow-[inset_0_0_15px_rgba(56,189,248,0.2)]"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Activity size={16} /> Summary
          </button>
          <button
            onClick={() => setView("raw")}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
              view === "raw"
                ? "bg-indigo-500/20 text-indigo-400 shadow-[inset_0_0_15px_rgba(99,102,241,0.2)]"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <List size={16} /> Raw Logs
          </button>
        </div>

        {/* Custom Range Calculator Widget */}
        {view === "summary" && (
          <div className="relative z-20 w-full sm:w-auto">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className={`w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                showDatePicker
                  ? "bg-sky-600 border-sky-500 text-white shadow-lg shadow-sky-900/40"
                  : "bg-[#1e293b] border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600"
              }`}
            >
              <Calculator size={16} /> Custom Range %
            </button>

            <AnimatePresence>
              {showDatePicker && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-full sm:w-80 p-5 rounded-2xl bg-[#0f172a] border border-sky-500/30 shadow-2xl shadow-sky-900/20"
                >
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-400 block mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full bg-black/40 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-sky-500/50"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-400 block mb-1">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full bg-black/40 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-sky-500/50"
                      />
                    </div>
                    <button
                      onClick={calculateCustomPercentage}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold text-sm transition-all shadow-md mt-2"
                    >
                      Calculate Percentage
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Filters & Month Navigator Line */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6 bg-black/20 p-4 rounded-2xl border border-slate-800/80">
        {/* Month Navigator */}
        <div className="flex items-center gap-4 w-full xl:w-auto justify-between xl:justify-start">
          <div className="flex items-center gap-2 p-1 bg-[#1e293b] rounded-xl border border-slate-700/50 shadow-inner">
            <button
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              onClick={handlePrevMonth}
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex items-center gap-2 w-32 justify-center px-2">
              <CalendarIcon size={16} className="text-sky-400" />
              <span className="font-bold text-lg text-white">
                {new Date(year, month - 1).toLocaleString("default", {
                  month: "short",
                })}{" "}
                {year}
              </span>
            </div>
            <button
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              onClick={handleNextMonth}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Search & Select Filters */}
        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-slate-500" />
            </div>
            <input
              type="text"
              placeholder="Search Name or Reg..."
              className="w-full pl-9 pr-4 py-2 bg-black/40 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-sky-500/50 text-sm transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {view === "summary" && (
            <select
              className="w-full sm:w-auto px-4 py-2 bg-black/40 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-sky-500/50 text-sm appearance-none outline-none custom-select-arrow"
              value={attendanceFilter}
              onChange={(e) => setAttendanceFilter(e.target.value)}
            >
              <option value="all">All Students</option>
              <option value="above80">Above 80%</option>
              <option value="below80">Below 80%</option>
            </select>
          )}
        </div>
      </div>

      {/* Main Data Table Area */}
      {loading ? (
        <div className="flex flex-col justify-center items-center min-h-[300px] border border-slate-700/50 rounded-3xl bg-black/20 gap-4">
          <Loader2 className="w-10 h-10 text-sky-500 animate-spin" />
          <p className="text-slate-400 font-medium">Processing Records...</p>
        </div>
      ) : (
        <div className="border border-slate-700/50 rounded-2xl bg-black/20 overflow-hidden shadow-inner custom-scrollbar relative z-10 w-full overflow-x-auto">
          {view === "raw" ? (
            // --- RAW VIEW TABLE ---
            <table className="w-full text-left whitespace-nowrap text-sm">
              <thead className="bg-[#0f172a]/90 text-slate-400 border-b border-slate-700/80 sticky top-0 z-10 backdrop-blur-md">
                <tr>
                  <th className="py-4 px-6 font-bold uppercase tracking-widest text-xs w-16 text-center">
                    Id
                  </th>
                  <th className="py-4 px-6 font-bold uppercase tracking-widest text-xs">
                    Name
                  </th>
                  <th className="py-4 px-6 font-bold uppercase tracking-widest text-xs">
                    Reg Num
                  </th>
                  <th className="py-4 px-6 font-bold uppercase tracking-widest text-xs">
                    Raw Timestamps
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {groupedStudents().length === 0 ? (
                  <tr>
                    <td
                      colSpan="4"
                      className="py-12 text-center text-slate-500 italic"
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <AlertCircle className="w-8 h-8 opacity-50" />
                        No attendance found.
                      </div>
                    </td>
                  </tr>
                ) : (
                  groupedStudents().map((student, idx) => (
                    <tr
                      key={student.fingerprintId || idx}
                      className="hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="py-4 px-6 font-medium text-slate-500 text-center">
                        {idx + 1}
                      </td>
                      <td className="py-4 px-6 font-bold text-white">
                        {student.name}
                      </td>
                      <td className="py-4 px-6 font-mono text-indigo-300 bg-indigo-500/5 rounded-md px-2 m-2 inline-block border border-indigo-500/10 text-xs mt-3.5">
                        {student.regNum?.toUpperCase() || "N/A"}
                      </td>
                      <td className="py-4 px-6 font-mono text-xs text-sky-300/80">
                        {student.timestamps &&
                        student.timestamps.filter(Boolean).length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {student.timestamps.filter(Boolean).map((ts, i) => (
                              <span
                                key={i}
                                className="bg-sky-900/40 border border-sky-500/20 px-2 array-1 rounded-md"
                              >
                                {new Date(ts).toLocaleString()}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-500 italic bg-black/40 px-3 py-1 rounded-md border border-slate-800">
                            No records
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            // --- SUMMARY VIEW TABLE ---
            <table className="w-full text-center whitespace-nowrap text-sm">
              <thead className="bg-[#0f172a]/95 border-b border-slate-700/80 sticky top-0 z-20 backdrop-blur-xl shadow-md border-t-0">
                <tr>
                  <th className="py-4 px-4 font-bold uppercase tracking-widest text-[10px] text-slate-500 sticky left-0 z-20 bg-[#0f172a] shadow-[inset_-1px_0_0_rgba(51,65,85,0.5)] border-t-0">
                    Student
                  </th>
                  {monthDays.map((day, idx) => (
                    <th
                      key={idx}
                      className="py-3 px-1.5 border-l border-slate-800/80 min-w-[50px]"
                    >
                      <div className="flex flex-col items-center gap-1 opacity-80">
                        <span className="text-[10px] uppercase font-bold text-sky-400 tracking-wider hidden sm:block">
                          {day.dayName}
                        </span>
                        <span className="sm:hidden text-[10px] uppercase font-bold text-sky-400 tracking-wider">
                          {day.dayName.charAt(0)}
                        </span>
                        <span
                          className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${day.date.toDateString() === today.toDateString() ? "bg-sky-500 text-white shadow-[0_0_10px_rgba(14,165,233,0.5)]" : "text-slate-300"}`}
                        >
                          {day.date.getDate()}
                        </span>
                      </div>
                    </th>
                  ))}
                  <th className="py-4 px-3 sticky right-0 z-20 bg-gradient-to-b from-indigo-900/90 to-[#0f172a] shadow-[inset_1px_0_0_rgba(99,102,241,0.5)] border-l border-indigo-500/20 border-t-0">
                    <span className="text-[10px] uppercase font-extrabold text-indigo-400 tracking-widest bg-indigo-500/10 px-2 py-1.5 rounded-md border border-indigo-500/20">
                      TOT %
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {groupedStudents().length === 0 ? (
                  <tr>
                    <td
                      colSpan={monthDays.length + 2}
                      className="py-12 text-center text-slate-500 italic"
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <AlertCircle className="w-8 h-8 opacity-50" />
                        No matches found.
                      </div>
                    </td>
                  </tr>
                ) : (
                  groupedStudents().map((student, idx) => (
                    <tr
                      key={student.fingerprintId || idx}
                      className="hover:bg-slate-800/30 transition-colors group"
                    >
                      {/* Sticky leftmost column: Name + Reg */}
                      <td className="py-3 px-4 sticky left-0 z-10 bg-[#0f172a] group-hover:bg-[#1e293b] shadow-[inset_-1px_0_0_rgba(51,65,85,0.5)] text-left transition-colors">
                        <div className="flex flex-col">
                          <span
                            className="font-bold text-white text-sm truncate max-w-[120px] sm:max-w-[200px]"
                            title={student.name}
                          >
                            {student.name}
                          </span>
                          <span className="font-mono text-[10px] text-slate-500 uppercase tracking-widest">
                            {student.regNum?.toUpperCase() || "N/A"}
                          </span>
                        </div>
                      </td>

                      {/* Day Cells */}
                      {student.dailyAttendance.map((att, dIdx) => {
                        const cellKey = `${student.id}-${dIdx}`;
                        const showTime = showTimesMap[cellKey] || false;
                        const isPresent = att.startsWith("P");
                        const isAbsent = att === "A";

                        return (
                          <td
                            key={dIdx}
                            onClick={() => {
                              if (isPresent) {
                                setShowTimesMap((prev) => ({
                                  ...prev,
                                  [cellKey]: !prev[cellKey],
                                }));
                              }
                            }}
                            className={`py-3 px-1.5 border-l border-slate-800/50 relative cursor-pointer group/cell ${isPresent ? "hover:bg-emerald-500/10" : isAbsent ? "hover:bg-rose-500/10" : "hover:bg-slate-800/50"} transition-colors`}
                          >
                            <div className="flex flex-col items-center justify-center h-full min-h-[40px]">
                              {isPresent ? (
                                <>
                                  <div className="w-5 h-5 flex items-center justify-center rounded-md bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                                    P
                                  </div>

                                  <AnimatePresence>
                                    {showTime && (
                                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 mt-6 z-30 p-2 bg-slate-800 border border-slate-600 rounded-lg shadow-xl shadow-black">
                                        <span className="text-[10px] font-mono text-emerald-300 whitespace-nowrap">
                                          {att.slice(2)}
                                        </span>
                                      </div>
                                    )}
                                  </AnimatePresence>
                                </>
                              ) : isAbsent ? (
                                <div className="w-5 h-5 flex items-center justify-center rounded-md bg-rose-500/10 text-rose-500/80 font-bold border border-rose-500/20">
                                  A
                                </div>
                              ) : (
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-800"></div>
                              )}
                            </div>
                          </td>
                        );
                      })}

                      {/* Sticky rightmost column: Percentage */}
                      <td className="py-3 px-3 sticky right-0 z-10 bg-[#0f172a] group-hover:bg-[#1e293b] shadow-[inset_1px_0_0_rgba(99,102,241,0.5)] transition-colors border-l border-indigo-500/20">
                        <div className="flex items-center justify-center w-full h-full">
                          <span
                            className={`px-2 py-1 rounded-lg text-xs font-bold border ${
                              parseInt(
                                customPercent[student.id] ?? student.percentage,
                              ) >= 80
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                            }`}
                          >
                            {customPercent[student.id] ?? student.percentage}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Global CSS block injected for styling custom select chevron */}
      <style>{`
        .custom-select-arrow {
          background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
          background-position: right 0.5rem center;
          background-repeat: no-repeat;
          background-size: 1.5em 1.5em;
          padding-right: 2.5rem;
        }
      `}</style>
    </div>
  );
};

export default Attendance;
