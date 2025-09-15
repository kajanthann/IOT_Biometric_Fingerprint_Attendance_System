import React, { useState, useEffect, useContext } from "react";
import { AppContext } from "../context/AppContext";
import { filterBySlots } from "../utils/attendanceUtils";

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
          // Only show for past or today
          if (dayDate > today) return "";

          const tsForDay = filteredTimestamps
            .map((ts) => new Date(ts))
            .filter(
              (d) =>
                d.getDate() === dayDate.getDate() &&
                d.getMonth() === dayDate.getMonth() &&
                d.getFullYear() === dayDate.getFullYear()
            );

          if (tsForDay.length > 0) {
            const uniqueTimes = [
              ...new Set(
                tsForDay.map((d) =>
                  d.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                )
              ),
            ];
            return `P (${uniqueTimes.join(", ")})`;
          } else {
            return "A"; // Absent for past/today
          }
        });

        const presentCount = dailyAttendance.filter((a) =>
          a.startsWith("P")
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
          student.name.toLowerCase().includes(search.toLowerCase()) ||
          student.indexNum?.toLowerCase().includes(search.toLowerCase())
      )
      .filter((student) => {
        if (attendanceFilter === "above80") return student.percentage >= 80;
        if (attendanceFilter === "below80") return student.percentage < 80;
        return true;
      });
  };

  const calculateCustomPercentage = () => {
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
        d.status.startsWith("P")
      ).length;
      const totalCount = countInRange.length;
      percentMap[student.id] =
        totalCount === 0 ? 0 : ((presentCount / totalCount) * 100).toFixed(2);
    });
    setCustomPercent(percentMap);
    setShowDatePicker(false);
  };

  return (
    <div className="p-4">
      {/* View Toggle */}
      <div className="flex gap-2  my-4">
        <button
          onClick={() => setView("summary")}
          className={`px-4 py-2 rounded ${
            view === "summary" ? "bg-green-500 text-white" : "bg-gray-200"
          }`}
        >
          Summary
        </button>
        <button
          onClick={() => setView("raw")}
          className={`px-4 py-2 rounded ${
            view === "raw" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
        >
          Raw Logs
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
        <div className="flex gap-4 items-center p-4">
          <h1 className="text-2xl font-bold">
            Attendance
          </h1>
          <div className="flex items-center gap-2">
            <span
              className="cursor-pointer border text-xl px-2 hover:bg-black hover:text-white"
              onClick={handlePrevMonth}
            >
              ←
            </span>
            <span>
              {month}/{year}
            </span>
            <span
              className="cursor-pointer border text-xl px-2 hover:bg-black hover:text-white"
              onClick={handleNextMonth}
            >
              →
            </span>
          </div>
          <div className="relative">
          <div
            className="cursor-pointer px-3 bg-black text-white font-bold rounded p-1 border"
            onClick={() => setShowDatePicker(!showDatePicker)}
          >
            %
          </div>
          {showDatePicker && (
            <div className="absolute md:top-[-60px] top-[-10px] left-[-300px] md:left-[-100px] bg-white border rounded p-2">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="border border-gray-300 rounded px-2 focus:outline-none focus:ring-2 focus:ring-green-400"
                />
                <span></span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="border border-gray-300 rounded px-2 focus:outline-none focus:ring-2 focus:ring-green-400"
                />
                <button
                  className="px-2 py-1 bg-green-500 text-white rounded cursor-pointer"
                  onClick={calculateCustomPercentage}
                >
                  Calculate
                </button>
              </div>
            </div>
          )}
          </div>
        </div>
        <div className="flex flex-column gap-4">
          <input
            type="text"
            placeholder="Search Name/Index..."
            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {view === "summary" && (
            <select
              className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
              value={attendanceFilter}
              onChange={(e) => setAttendanceFilter(e.target.value)}
            >
              <option value="all">All</option>
              <option value="above80">Above 80%</option>
              <option value="below80">Below 80%</option>
            </select>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center min-h-[200px]">
          <div
            className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4"
            style={{ color: "#02c986" }}
          />
        </div>
      ) : view === "raw" ? (
        <div className="overflow-x-auto">
          <table className="min-w-full border text-center">
            <thead className="bg-blue-600 text-white sticky top-0">
              <tr>
                <th className="py-1 px-2 border">#</th>
                <th className="py-1 px-2 border">Name</th>
                <th className="py-1 px-2 border">Index</th>
                <th className="py-1 px-2 border">Timestamps</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-4 text-gray-500 italic">
                    No attendance found.
                  </td>
                </tr>
              ) : (
                students.map((s, idx) => (
                  <tr
                    key={s.fingerprintId || idx}
                    className="hover:bg-gray-100"
                  >
                    <td className="py-1 px-2 border">{idx + 1}</td>
                    <td className="py-1 px-2 border">{s.name}</td>
                    <td className="py-1 px-2 border">{s.indexNum}</td>
                    <td className="py-1 px-2 border text-left">
                      {s.timestamps.filter(Boolean).map((ts, i) => (
                        <div key={i}>{new Date(ts).toLocaleString()}</div>
                      ))}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border text-center">
            <thead className="bg-slate-100 sticky top-0">
              <tr>
                <th className="py-1 px-2 border">#</th>
                <th className="py-1 px-2 border">Name</th>
                <th className="py-1 px-2 border">Index</th>
                {monthDays.map((day, idx) => (
                  <th key={idx} className="py-1 px-2 border text-xs">
                    {day.dayName}
                    <br />
                    {day.date.getDate()}
                  </th>
                ))}
                <th className="py-2 px-2 border bg-blue-500">
                  <div
                    className="cursor-pointer"
                  >
                    %
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {groupedStudents().map((student, idx) => (
                <tr
                  key={student.fingerprintId || idx}
                  className="hover:bg-gray-100"
                >
                  <td className="py-1 px-2 border">{idx + 1}</td>
                  <td className="py-1 px-2 border">{student.name}</td>
                  <td className="py-1 px-2 border">{student.indexNum}</td>
                  {student.dailyAttendance.map((att, dIdx) => {
                    const cellKey = `${student.id}-${dIdx}`;
                    const showTime = showTimesMap[cellKey] || false;
                    return (
                      <td
                        key={dIdx}
                        className={`py-1 px-2 border font-bold ${
                          att.startsWith("P")
                            ? "bg-green-200 cursor-pointer"
                            : att === "A"
                            ? "bg-red-50/70 text-red-600"
                            : ""
                        }`}
                        onClick={() => {
                          if (att.startsWith("P")) {
                            setShowTimesMap((prev) => ({
                              ...prev,
                              [cellKey]: !prev[cellKey],
                            }));
                          }
                        }}
                      >
                        {att.startsWith("P") ? (
                          <>
                            P{" "}
                            {showTime && (
                              <span className="text-[10px] font-normal">
                                ({att.slice(3, -1)})
                              </span>
                            )}
                          </>
                        ) : att === "A" ? (
                          "A"
                        ) : (
                          ""
                        )}
                      </td>
                    );
                  })}
                  <td className="py-2 px-2 border font-bold">
                    {customPercent[student.id] ?? student.percentage}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Attendance;
