// src/pages/Dashboard.jsx
import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ref, onValue } from "firebase/database";
import { database } from "../firebase";
import Hero from "../components/Hero";

const Dashboard = () => {
  const [students, setStudents] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let studentsLoaded = false;
    let logsLoaded = false;

    // Fetch students
    const studentsRef = ref(database, "students");
    onValue(studentsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const studentArray = Object.values(data).map((s) => ({
          id: s.id,
          name: s.name,
          regId: s.regId || `SE2025${s.id.toString().padStart(3, "0")}`,
          fingerprintId: s.id,
          attendancePercent: s.attendancePercent || 0,
        }));
        setStudents(studentArray);
      } else {
        setStudents([]);
      }
      studentsLoaded = true;
      if (studentsLoaded && logsLoaded) setLoading(false);
    });

    // Fetch attendance logs
    const attendanceRef = ref(database, "attendance");
    onValue(attendanceRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const logsArray = Object.values(data)
          .map((a) => ({
            id: a.id,
            name: a.name,
            timestamp: a.timestamp,
            status: a.status || "Present",
          }))
          .reverse()
          .slice(0, 20); // latest 20 logs
        setLogs(logsArray);
      } else {
        setLogs([]);
      }
      logsLoaded = true;
      if (studentsLoaded && logsLoaded) setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4" style={{ color: '#02c986' }}></div>
      </div>
    );
  }

  // Compute summary metrics
  const totalStudents = students.length;
  const totalWeeks = 14;
  const avgAttendance =
    students.length > 0
      ? students.reduce((sum, s) => sum + s.attendancePercent, 0) / students.length
      : 0;
  const studentsPresentToday = logs.filter((l) => l.status === "Present").length;
  const studentsAbsentToday = logs.filter((l) => l.status === "Absent").length;

  // Pie chart data
  const pieData = [
    { name: ">=75%", value: students.filter((s) => s.attendancePercent >= 75).length },
    { name: "<75%", value: students.filter((s) => s.attendancePercent < 75).length },
  ];

  // Weekly trend (replace with real calculation if needed)
  const weeklyTrend = Array.from({ length: totalWeeks }, (_, i) => ({
    week: `Week ${i + 1}`,
    average: Math.floor(Math.random() * 30 + 70),
  }));

  return (
    <div className="p-6 space-y-6">
      <Hero />
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-green-400 p-4 rounded shadow text-center text-white">
          <h2 className="text-sm font-semibold">Total Students</h2>
          <p className="text-2xl font-bold">{totalStudents}</p>
        </div>
        <div className="bg-blue-400 p-4 rounded shadow text-center text-white">
          <h2 className="text-sm font-semibold">Total Weeks</h2>
          <p className="text-2xl font-bold">{totalWeeks}</p>
        </div>
        <div className="bg-yellow-400 p-4 rounded shadow text-center text-white">
          <h2 className="text-sm font-semibold">Avg Attendance %</h2>
          <p className="text-2xl font-bold">{avgAttendance.toFixed(2)}%</p>
        </div>
        <div className="bg-green-600 p-4 rounded shadow text-center text-white">
          <h2 className="text-sm font-semibold">Present Today</h2>
          <p className="text-2xl font-bold">{studentsPresentToday}</p>
        </div>
        <div className="bg-red-500 p-4 rounded shadow text-center text-white">
          <h2 className="text-sm font-semibold">Absent Today</h2>
          <p className="text-2xl font-bold">{studentsAbsentToday}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-bold mb-2">Attendance % by Student</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={students}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="attendancePercent" fill="#4ade80" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-bold mb-2">Attendance Compliance</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#60a5fa"
                label
              />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Weekly Trend */}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="text-xl font-bold mb-2">Weekly Attendance Trend</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={weeklyTrend}>
            <XAxis dataKey="week" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="average" stroke="#facc15" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Logs */}
      <div className="bg-white p-4 rounded shadow overflow-x-auto">
        <h2 className="text-xl font-bold mb-2">Recent Attendance Logs</h2>
        <table className="min-w-full border border-gray-200 text-center">
          <thead className="bg-green-500 text-white">
            <tr>
              <th className="py-2 px-4 border">ID</th>
              <th className="py-2 px-4 border">Name</th>
              <th className="py-2 px-4 border">Timestamp</th>
              <th className="py-2 px-4 border">Status</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-4 text-gray-500 italic">
                  No attendance logs found.
                </td>
              </tr>
            ) : (
              logs.map((log, idx) => (
                <tr
                  key={idx}
                  className={log.status === "Absent" ? "bg-red-100" : "bg-white"}
                >
                  <td className="py-2 px-4 border">{log.id}</td>
                  <td className="py-2 px-4 border">{log.name}</td>
                  <td className="py-2 px-4 border">{log.timestamp}</td>
                  <td className="py-2 px-4 border">{log.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;
