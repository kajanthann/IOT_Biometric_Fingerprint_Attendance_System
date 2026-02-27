import React, { useState, useEffect, useContext } from "react";
import { ref, set, onValue, off } from "firebase/database";
import { database } from "../firebase";
import { AppContext } from "../context/AppContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserPlus,
  Clipboard,
  XOctagon,
  Loader2,
  Fingerprint,
} from "lucide-react";

const RegisterStudent = ({ onClose }) => {
  const [name, setName] = useState("");
  const [regNum, setRegNum] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { espStatus } = useContext(AppContext);

  useEffect(() => {
    const msgRef = ref(database, "/messages");
    const listener = onValue(msgRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list = Object.values(data).map((item) => item.msg);
        setMessages(list);

        const stopLoadingKeywords = [
          "Enroll Success",
          "Image error",
          "Invalid data",
          "Image fail",
          "2nd fail",
          "Model fail",
          "Store fail",
          "Already Enrolled",
        ];

        const stopLoading = list.some((msg) =>
          stopLoadingKeywords.some((keyword) => msg.includes(keyword))
        );

        if (stopLoading) {
          setLoading(false);

          if (list.some((msg) => msg.includes("Enroll Success"))) {
            setName("");
            setRegNum("");
            setTimeout(() => {
              if (onClose) onClose();
            }, 2000);
          }

          const failMsg = list.find((msg) =>
            stopLoadingKeywords.slice(1).some((keyword) => msg.includes(keyword))
          );
          setError(failMsg || "");
        }
      } else {
        setMessages([]);
      }
    });

    return () => off(msgRef, "value", listener);
  }, [onClose]);

  const startEnroll = async () => {
    if (!name || !regNum) {
      setError("Please fill all fields!");
      return;
    }

    setLoading(true);
    setMessages([]);
    setError("");

    try {
      await set(ref(database, "/enrollData"), { name, regNum });
      await set(ref(database, "/systemState"), "ENROLL");
    } catch (err) {
      console.error("Firebase write error:", err);
      setLoading(false);
      setError("Failed to start enrollment.");
    }
  };

  const cancelEnroll = async () => {
    try {
      await set(ref(database, "/systemState"), "VERIFY");
      setLoading(false);
      setError("");
      setMessages((prev) => [...prev, "Enrollment cancelled"]);
    } catch (err) {
      console.error("Failed to cancel enrollment:", err);
      setError("Failed to cancel enrollment.");
    }
  };

  return (
    <div className="w-full flex">
      <div className="flex flex-col lg:flex-row w-full bg-[#0a0f18] rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-slate-700/50">
        {/* Left Side: Form */}
        <div className="flex-1 p-6 md:p-8 bg-gradient-to-br from-[#111827] to-[#0f172a] relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full blur-[60px]"></div>

          <div className="flex items-center gap-4 mb-8">
            <div className="p-2 rounded-xl text-sky-400 border border-sky-500/30">
              <UserPlus size={16} />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-wide text-white">
                New Enrollment
              </h2>
            </div>
          </div>

          <div className="space-y-5 relative z-10">
            <div>
              <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2 font-bold">
                Student Name
              </label>
              <input
                type="text"
                placeholder="Enter full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 transition-all font-medium disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2 font-bold">
                Registration Number
              </label>
              <input
                type="text"
                placeholder="e.g. IT20123456"
                value={regNum}
                onChange={(e) => setRegNum(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 transition-all font-medium disabled:opacity-50 uppercase"
              />
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                className="mt-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-3 font-medium"
              >
                <XOctagon size={18} />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-col sm:flex-row items-center justify-between mt-10 pt-6 border-t border-slate-800 gap-4">
            <div className="flex w-full sm:w-auto items-center gap-3">
              <button
                onClick={startEnroll}
                disabled={loading || espStatus !== "ONLINE"}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 rounded-full py-2 font-bold text-white transition-all duration-300 shadow-lg ${
                  loading || espStatus !== "ONLINE"
                    ? "bg-slate-800 cursor-not-allowed text-slate-500 shadow-none border border-slate-700"
                    : "bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 shadow-sky-900/50 border border-sky-400/30 hover:scale-105"
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Enrolling...
                  </>
                ) : (
                  <>
                    <Fingerprint size={18} />
                    Scan <div className="hidden md:block">Finger</div> 
                  </>
                )}
              </button>

              <button
                onClick={cancelEnroll}
                disabled={!loading}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-full font-bold transition-all duration-300 ${
                  !loading
                    ? "bg-black/20 text-slate-600 cursor-not-allowed border border-slate-800/50"
                    : "bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 shadow-lg shadow-rose-900/20"
                }`}
              >
                Cancel
              </button>
            </div>

            <div className="flex items-center gap-3 bg-black/40 px-4 py-2.5 rounded-full border border-slate-800 shadow-inner">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    espStatus === "ONLINE"
                      ? "bg-emerald-500 shadow-[0_0_10px_#10b981] animate-pulse"
                      : "bg-rose-500 shadow-[0_0_10px_#f43f5e] animate-pulse"
                  }`}
                ></span>
                <span
                  className={`text-xs font-bold tracking-wider uppercase ${
                    espStatus === "ONLINE" ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {espStatus}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Terminal */}
        <div className="flex-1 bg-black/80 p-6 md:p-8 border-l border-slate-800 flex flex-col relative overflow-hidden">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800/80">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
              <Clipboard size={16} /> Device Output
            </h2>
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500/30 border border-rose-500/50"></div>
              <div className="w-3 h-3 rounded-full bg-amber-500/30 border border-amber-500/50"></div>
              <div className="w-3 h-3 rounded-full bg-emerald-500/30 border border-emerald-500/50"></div>
            </div>
          </div>

          <div className="flex-1 h-64 lg:h-auto overflow-y-auto rounded-xl bg-black/40 font-mono text-sm leading-relaxed custom-scrollbar relative">
            <AnimatePresence>
              {messages.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center text-slate-600/50 italic text-sm"
                >
                  Waiting for device telemetry...
                </motion.div>
              ) : (
                <div className="space-y-2 p-2 w-full">
                  {messages.map((msg, idx) => (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      key={idx}
                      className={`px-3 py-1.5 rounded-md text-[13px] ${
                        msg.includes("error") ||
                        msg.includes("fail") ||
                        msg.includes("cancelled")
                          ? "text-rose-400 bg-rose-500/5"
                          : msg.includes("Success") || msg.includes("Stored")
                          ? "text-emerald-400 bg-emerald-500/5"
                          : "text-sky-300 bg-sky-500/5"
                      } break-words border-l-2 ${
                        msg.includes("error") ||
                        msg.includes("fail") ||
                        msg.includes("cancelled")
                          ? "border-rose-500/50"
                          : msg.includes("Success") || msg.includes("Stored")
                          ? "border-emerald-500/50"
                          : "border-sky-500/50"
                      }`}
                    >
                      <span className="text-slate-600 mr-2 opacity-50">{`>`}</span>
                      {msg}
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterStudent;