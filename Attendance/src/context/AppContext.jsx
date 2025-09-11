// src/context/AppContext.jsx
import { createContext, useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "../firebase";
import Papa from "papaparse";

export const AppContext = createContext();

const AppContextProvider = ({ children }) => {
  const [students, setStudents] = useState([]);
  const [modules, setModules] = useState([]);
  const [data, setData] = useState([]); // raw CSV data if needed
  const [loading, setLoading] = useState(true);
  const [espStatus, setEspStatus] = useState("OFFLINE"); // NEW: ESP32 status
  const [lastSeen, setLastSeen] = useState(null); // NEW: lastSeen timestamp

  const ADMIN_EMAIL = "smarfingeriot32@gmail.com";

  const csvUrl =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vQw3N9IWLeLtfrevd9rwZzzJHJYw8RD48iHKdmxgsK9MnFnEnRUYF683S9G_m62UXYKOYOmDBHf5M-k/pub?output=csv";

  // ✅ --- CSV FETCH ---
  const fetchCSV = (callback, header = true) => {
    Papa.parse(csvUrl, {
      download: true,
      header,
      skipEmptyLines: true,
      complete: callback,
      error: (err) => console.error("CSV Error:", err),
    });
  };

  // ✅ --- MODULE FETCH ---
  const fetchModules = () => {
    fetchCSV((results) => {
      const rows = results.data.map((row) => Object.values(row));
      const tempModules = [];

      for (let r = 2; r < rows.length; r++) {
        const time = rows[r][0]?.trim();
        for (let c = 1; c < rows[r].length; c++) {
          const mod = rows[r][c]?.trim();
          const day = rows[1][c]?.trim();
          if (
            mod &&
            mod !== "" &&
            mod.toLowerCase() !== "break" &&
            mod !== "-" &&
            !["monday", "tuesday", "wednesday", "thursday", "friday"].includes(
              mod.toLowerCase()
            )
          ) {
            tempModules.push({ name: mod.replace(/\n/g, " "), day, time });
          }
        }
      }

      // Sort by day & start time
      const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
      tempModules.sort((a, b) => {
        const dayDiff = dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
        if (dayDiff !== 0) return dayDiff;
        return (
          parseFloat(a.time.split("-")[0].replace(":", ".")) -
          parseFloat(b.time.split("-")[0].replace(":", "."))
        );
      });

      setModules(tempModules);
      setData(results.data); // optional: keep raw CSV
    }, false);
  };

  /// --- ESP32 STATUS BASED ON HEARTBEAT ---
  const fetchEspStatus = () => {
    const statusRef = ref(database, "status"); // /status in Firebase
    let lastValue = null;
    let lastChangeTime = Date.now();

    onValue(statusRef, (snapshot) => {
      const currentValue = snapshot.val();
      if (!currentValue) return;

      setLastSeen(currentValue);

      if (lastValue === null || currentValue !== lastValue) {
        setEspStatus("ONLINE");
        lastChangeTime = Date.now(); // reset timer on value change
      }

      lastValue = currentValue;
    });

    // Timer to mark OFFLINE if no change in 10s
    const interval = setInterval(() => {
      if (lastChangeTime && Date.now() - lastChangeTime > 12000) {
        setEspStatus("OFFLINE");
      }
    }, 1000); // check every 1 second

    // Clean up interval if component unmounts
    return () => clearInterval(interval);
  };

  // ✅ --- STUDENT + ATTENDANCE FETCH ---
  const fetchStudentsAndAttendance = () => {
    const studentsRef = ref(database, "students");
    const attendanceRef = ref(database, "attendance");

    onValue(studentsRef, (snapshot) => {
      const fbData = snapshot.val();
      const studentMap = fbData
        ? Object.keys(fbData).reduce((acc, key) => {
            acc[fbData[key].fingerprintId || fbData[key].id] = {
              indexNum: fbData[key].indexNum,
              regNum: fbData[key].regNum || "",
              name: fbData[key].name,
              fingerprintId: fbData[key].fingerprintId || fbData[key].id,
              attendance: [],
              timestamps: [],
            };
            return acc;
          }, {})
        : {};

      onValue(attendanceRef, (snapshot2) => {
        const attData = snapshot2.val();
        if (attData) {
          Object.keys(attData).forEach((key) => {
            const att = attData[key];
            const student = studentMap[att.id];
            if (student) {
              student.attendance.push(1);
              student.timestamps.push(att.timestamp);
            }
          });
        }
        setStudents(Object.values(studentMap));
        setLoading(false);
      });
    });
  };

  // ✅ --- HELPERS MOVED FROM ATTENDANCE COMPONENT ---
  const groupedStudents = (
    monthDays,
    search = "",
    attendanceFilter = "all"
  ) => {
    const studentMap = {};
    students.forEach((att) => {
      if (!att.fingerprintId || !att.name || !att.timestamps) return;
      if (!studentMap[att.fingerprintId])
        studentMap[att.fingerprintId] = {
          id: att.fingerprintId,
          name: att.name,
          indexNum: att.indexNum,
          timestamps: [],
        };
      studentMap[att.fingerprintId].timestamps.push(...att.timestamps);
    });

    return Object.values(studentMap)
      .map((student) => {
        const dailyAttendance = monthDays.map((day) => {
          const tsForDay = student.timestamps
            .map((ts) => new Date(ts))
            .filter(
              (d) =>
                d.getDate() === day.date.getDate() &&
                d.getMonth() === day.date.getMonth() &&
                d.getFullYear() === day.date.getFullYear()
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
          } else return "";
        });

        const presentCount = dailyAttendance.filter((a) =>
          a.startsWith("P")
        ).length;
        const percentage = (
          (presentCount / dailyAttendance.length) *
          100
        ).toFixed(2);

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

  const calculateCustomPercentage = (monthDays, startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const percentMap = {};
    groupedStudents(monthDays).forEach((student) => {
      const countInRange = monthDays
        .map((day, idx) => ({
          date: day.date,
          status: student.dailyAttendance[idx],
        }))
        .filter((d) => d.date >= start && d.date <= end);

      const presentCount = countInRange.filter((d) =>
        d.status.startsWith("P")
      ).length;
      const totalCount = countInRange.length;
      percentMap[student.id] =
        totalCount === 0 ? 0 : ((presentCount / totalCount) * 100).toFixed(2);
    });
    return percentMap;
  };

  // --- INIT ---
  useEffect(() => {
    fetchModules();
    fetchStudentsAndAttendance();
    fetchEspStatus();
  }, []);

  const value = {
    students,
    modules,
    data,
    loading,
    espStatus,
    groupedStudents,
    calculateCustomPercentage,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export default AppContextProvider;
