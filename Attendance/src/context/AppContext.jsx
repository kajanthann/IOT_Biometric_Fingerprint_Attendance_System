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

  const csvUrl =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vQw3N9IWLeLtfrevd9rwZzzJHJYw8RD48iHKdmxgsK9MnFnEnRUYF683S9G_m62UXYKOYOmDBHf5M-k/pub?output=csv";

  // Generic CSV fetcher
  const fetchCSV = (callback, header = true) => {
    Papa.parse(csvUrl, {
      download: true,
      header,
      skipEmptyLines: true,
      complete: callback,
      error: (err) => console.error("CSV Error:", err),
    });
  };

  // Fetch modules from CSV
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

  // Fetch students + attendance
  const fetchStudentsAndAttendance = () => {
    const studentsRef = ref(database, "students");
    const attendanceRef = ref(database, "attendance");

    // Fetch Firebase students
    onValue(studentsRef, (snapshot) => {
      const fbData = snapshot.val();
      const studentMap = fbData
        ? Object.keys(fbData).reduce((acc, key) => {
            acc[fbData[key].fingerprintId || fbData[key].id] = {
              indexNum: fbData[key].indexNum,
              regNum: fbData[key].regNum || "",
              name: fbData[key].name,
              fingerprintId: fbData[key].fingerprintId || fbData[key].id,
              attendance: Array(14).fill(0),
              timestamps: Array(14).fill(null),
            };
            return acc;
          }, {})
        : {};

      // Fetch attendance
      onValue(attendanceRef, (snapshot2) => {
        const attData = snapshot2.val();
        if (attData) {
          Object.keys(attData).forEach((key) => {
            const att = attData[key];
            const student = studentMap[att.id];
            if (student) {
              // Find first 0 slot
              const idx = student.attendance.findIndex((v) => v === 0);
              if (idx !== -1) {
                student.attendance[idx] = 1;
                student.timestamps[idx] = att.timestamp;
              }
            }
          });
        }
        setStudents(Object.values(studentMap));
        setLoading(false);
      });
    });
  };

  useEffect(() => {
    fetchModules();
    fetchStudentsAndAttendance();
  }, []);

  const value = { students, modules, data, loading };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export default AppContextProvider;
