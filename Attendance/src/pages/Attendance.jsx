import React, { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "../firebase";

// Convert "HH:MM" → minutes
const timeToMinutes = (timeStr) => {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
};

// Check if a Date object is inside a slot
const isInSlot = (date, slot) => {
  const mins = date.getHours() * 60 + date.getMinutes();
  return mins >= timeToMinutes(slot.start) && mins <= timeToMinutes(slot.end);
};

// Keep only the first attendance in each slot
const filterBySlots = (timestamps, slots) => {
  const kept = [];
  slots.forEach((slot) => {
    const inSlot = timestamps
      .map((ts) => new Date(ts))
      .filter((d) => isInSlot(d, slot));

    if (inSlot.length > 0) {
      const earliest = inSlot.reduce((a, b) => (a < b ? a : b));
      kept.push(earliest.toISOString());
    }
  });
  return kept;
};

const Attendance = ({ day, timeSlots = [] }) => {
  const [search, setSearch] = useState("");
  const [students, setStudents] = useState([]);
  const [attendanceFilter, setAttendanceFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("summary"); // "summary" | "raw"

  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [customPercent, setCustomPercent] = useState({});

  // Generate days in the month
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

  useEffect(() => {
    setMonthDays(generateMonthDays(year, month));
  }, [month, year]);

  // Fetch all attendance
  useEffect(() => {
    const attendanceRef = ref(database, "attendance");
    onValue(attendanceRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setStudents([]);
        setLoading(false);
        return;
      }
      const records = Object.keys(data).map((key) => ({
        firebaseId: key,
        ...data[key],
      }));
      setStudents(records);
      setLoading(false);
    });
  }, []);

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

  // --- Summary View ---
  const groupedStudents = () => {
    const studentMap = {};
    students.forEach((att) => {
      if (!att.id || !att.name || !att.timestamp) return;
      if (!studentMap[att.id]) {
        studentMap[att.id] = { id: att.id, name: att.name, indexNum: att.indexNum, timestamps: [] };
      }
      studentMap[att.id].timestamps.push(att.timestamp);
    });

    return Object.values(studentMap).map((student) => {
      let filteredTimestamps = [...student.timestamps];
      if (timeSlots.length > 0) {
        filteredTimestamps = filterBySlots(student.timestamps, timeSlots);
      }

      const dailyAttendance = monthDays.map((day) => {
        const tsForDay = filteredTimestamps
          .map((ts) => new Date(ts))
          .filter(
            (d) =>
              d.getDate() === day.date.getDate() &&
              d.getMonth() === day.date.getMonth() &&
              d.getFullYear() === day.date.getFullYear()
          );

        if (tsForDay.length > 0) {
          const timesStr = tsForDay
            .map((d) => d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }))
            .join(", ");
          return `P (${timesStr})`;
        } else return "";
      });

      const presentCount = dailyAttendance.filter((a) => a.startsWith("P")).length;
      const percentage = ((presentCount / dailyAttendance.length) * 100).toFixed(2);

      return { ...student, dailyAttendance, percentage };
    })
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
        .map((day, idx) => ({ date: day.date, status: student.dailyAttendance[idx] }))
        .filter((d) => d.date >= start && d.date <= end);

      const presentCount = countInRange.filter((d) => d.status.startsWith("P")).length;
      const totalCount = countInRange.length;
      percentMap[student.id] = totalCount === 0 ? 0 : ((presentCount / totalCount) * 100).toFixed(2);
    });

    setCustomPercent(percentMap);
    setShowDatePicker(false);
  };

  return (
    <div className="p-6">
      {/* View Toggle */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => setView("summary")} className={`px-4 py-2 rounded ${view === "summary" ? "bg-green-500 text-white" : "bg-gray-200"}`}>Summary View</button>
        <button onClick={() => setView("raw")} className={`px-4 py-2 rounded ${view === "raw" ? "bg-blue-500 text-white" : "bg-gray-200"}`}>Raw Logs View</button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <input type="text" placeholder="Search by Name / Index..." className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400" value={search} onChange={(e) => setSearch(e.target.value)} />
        {view === "summary" && (
          <select className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400" value={attendanceFilter} onChange={(e) => setAttendanceFilter(e.target.value)}>
            <option value="all">All Students</option>
            <option value="above80">Above 80%</option>
            <option value="below80">Below 80%</option>
          </select>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center min-h-[300px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4" style={{ color: "#02c986" }} />
        </div>
      ) : view === "raw" ? (
        <div className="overflow-x-auto shadow-md rounded-lg">
          <table className="min-w-full border border-gray-200 text-center">
            <thead className="bg-blue-600 text-white sticky top-0">
              <tr>
                <th>#</th><th>Name</th><th>Index</th><th>Timestamp</th><th>Date/Time</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr><td colSpan="5" className="py-4 text-center text-gray-500 italic">No attendance found.</td></tr>
              ) : students.map((att, index) => (
                <tr key={att.firebaseId} className="hover:bg-gray-100">
                  <td>{index + 1}</td><td>{att.name}</td><td>{att.indexNum}</td><td>{att.timestamp}</td><td>{new Date(att.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto shadow-md rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="cursor-pointer" onClick={handlePrevMonth}>⬅</span>
            {month}/{year}
            <span className="cursor-pointer" onClick={handleNextMonth}>➡</span>
          </div>
          <table className="min-w-full border border-gray-200 text-center">
            <thead className="bg-green-600 text-white sticky top-0">
              <tr>
                <th>#</th><th>Name</th><th>Index</th>
                {monthDays.map((day, idx) => (
                  <th key={idx} className="py-1 px-2 border text-xs">{day.dayName}<br/>{day.date.getDate()}</th>
                ))}
                <th>%</th>
              </tr>
            </thead>
            <tbody>
              {groupedStudents().length === 0 ? (
                <tr><td colSpan={monthDays.length + 4} className="py-4 text-center text-gray-500 italic">No students found.</td></tr>
              ) : groupedStudents().map((student, index) => (
                <tr key={student.id} className="hover:bg-gray-100">
                  <td>{index + 1}</td>
                  <td>{student.name}</td>
                  <td>{student.indexNum}</td>
                  {student.dailyAttendance.map((att, idx) => (
                    <td key={idx} className={`py-1 px-2 border font-bold ${att.startsWith("P") ? "bg-green-200" : "bg-gray-50"}`}>{att}</td>
                  ))}
                  <td className="py-2 px-2 border font-bold">{customPercent[student.id] ?? student.percentage}%</td>
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
