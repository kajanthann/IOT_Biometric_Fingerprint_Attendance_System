import React, { useContext, useState } from "react";
import { AppContext } from "../context/AppContext";
import RegisterStudent from "../components/RegisterStudent";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  UserPlus,
  X,
  Loader2,
  Search,
  Fingerprint,
  AlertCircle,
} from "lucide-react";

const ADMIN_EMAIL = "smarfingeriot32@gmail.com";

const Students = ({ token, adminEmail }) => {
  const { students, loading } = useContext(AppContext);
  const [showRegister, setShowRegister] = useState(false);
  const [search, setSearch] = useState("");

  const isAdmin = token && adminEmail === ADMIN_EMAIL;

  const filteredStudents = students.filter(
    (s) =>
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.regNum?.toLowerCase().includes(search.toLowerCase()) ||
      (s.fingerprintId && `FID_${s.fingerprintId}`.includes(search)),
  );

  return (
    <div className="min-h-screen bg-[#0f172a] p-4 sm:p-6 lg:p-8 font-sans relative overflow-hidden">
      {/* Background glow shadow */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-sky-900/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-900/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header Dashboard Panel */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6 bg-[#111827]/80 backdrop-blur-xl border border-slate-700/50 p-6 rounded-xl shadow-2xl">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4"
          >
            <div className="p-3 bg-sky-500/10 text-sky-400 rounded-xl border border-sky-500/20 shadow-inner">
              <Users size={28} />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                Student Directory
              </h2>
              <p className="text-slate-400 text-sm font-medium mt-1">
                Manage enrolled student profiles
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto"
          >
            {/* Dark Search Bar */}
            <div className="relative w-full sm:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-slate-500" />
              </div>
              <input
                type="text"
                placeholder="Search students..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-slate-700/50 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500/50 focus:border-sky-500/50 transition-all font-medium shadow-inner"
              />
            </div>

            {isAdmin && (
              <button
                onClick={() => setShowRegister(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 font-bold uppercase tracking-wider text-xs rounded-xl text-white bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 shadow-lg shadow-sky-900/50 border border-sky-400/30 transition-all hover:scale-105"
              >
                <UserPlus size={16} />
                Enroll Student
              </button>
            )}
          </motion.div>
        </div>

        {/* Modal for Enrollment View */}
        <AnimatePresence>
          {showRegister && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-md z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="w-full max-w-5xl max-h-[90vh] overflow-y-auto custom-scrollbar relative bg-transparent rounded-3xl"
              >
                <div className="sticky top-0 right-0 p-4 flex justify-end z-20 pointer-events-none">
                  <button
                    onClick={() => setShowRegister(false)}
                    className="p-1 bg-slate-800/80 text-slate-400 rounded-full border border-slate-700/50 backdrop-blur-sm shadow-xl transition-all pointer-events-auto hover:bg-rose-500/20 hover:border-rose-500/30 hover:text-rose-400"
                  >
                    <X size={15} />
                  </button>
                </div>
                <div className="-mt-13 relative z-10">
                  <RegisterStudent onClose={() => setShowRegister(false)} />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Students Data Grid */}
        <div className="bg-[#111827]/80 backdrop-blur-xl border border-slate-700/50 rounded-xl p-1 shadow-2xl overflow-hidden relative">
          {/* Top accent line */}
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-sky-500 via-indigo-500 to-sky-500"></div>

          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
              <Loader2 className="w-10 h-10 text-sky-500 animate-spin" />
              <p className="text-slate-400 font-medium tracking-wide">
                Loading student directory...
              </p>
            </div>
          ) : students.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 p-8 text-center bg-black/20 m-4 rounded-2xl border border-slate-800/50">
              <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center text-slate-500 border border-slate-700/50 shadow-inner">
                <AlertCircle size={28} />
              </div>
              <p className="text-slate-400 font-medium text-lg">
                No students registered yet.
              </p>
              {isAdmin && (
                <p className="text-slate-500 text-sm">
                  Click "Enroll Student" to add the first profile to the
                  database.
                </p>
              )}
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 p-8 text-center bg-black/20 m-4 rounded-2xl border border-slate-800/50">
              <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center text-slate-500 border border-slate-700/50 shadow-inner">
                <Search size={28} />
              </div>
              <p className="text-slate-400 font-medium text-lg">
                No matches found for "{search}"
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto custom-scrollbar rounded-xl bg-black/20 m-4 border border-slate-800/80 shadow-inner">
              <table className="w-full text-left whitespace-nowrap">
                <thead className="bg-[#0f172a]/90 backdrop-blur-md sticky top-0 z-10 border-b border-slate-700/80">
                  <tr>
                    <th className="py-4 px-6 font-bold uppercase tracking-widest text-[11px] text-slate-500 w-16 text-center">
                      Id
                    </th>
                    <th className="py-4 px-6 font-bold uppercase tracking-widest text-[11px] text-sky-500">
                      Fingerprint Tag
                    </th>
                    <th className="py-4 px-6 font-bold uppercase tracking-widest text-[11px] text-slate-400">
                      Student Name
                    </th>
                    <th className="py-4 px-6 font-bold uppercase tracking-widest text-[11px] text-slate-400">
                      Registration N.
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredStudents.map((student, index) => (
                    <motion.tr
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      key={index}
                      className="hover:bg-slate-800/30 transition-colors group"
                    >
                      <td className="py-4 px-6 font-medium text-slate-500 text-sm text-center">
                        {(index + 1).toString().padStart(2, "0")}
                      </td>
                      <td className="py-4 px-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-widest text-sky-300 bg-sky-500/10 border border-sky-500/20 shadow-sm transition-all group-hover:bg-sky-500/20">
                          <Fingerprint
                            size={14}
                            className="opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all"
                          />
                          FID_{student.fingerprintId}
                        </div>
                      </td>
                      <td className="py-4 px-6 font-bold text-white tracking-wide">
                        {student.name}
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-mono text-sm text-indigo-300 bg-indigo-500/5 px-2 py-1.5 rounded-md border border-indigo-500/10 uppercase tracking-widest inline-block">
                          {student.regNum || "UNREGISTERED"}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Students;
