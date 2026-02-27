import React from "react";
import { motion } from "framer-motion";
import { Fingerprint, ShieldCheck, Zap } from "lucide-react";

const Hero = () => {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-[#0f172a] border border-white/5 shadow-2xl mb-8 p-8 md:p-12">
      {/* Background glow effects */}
      <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-sky-500/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px] pointer-events-none"></div>

      <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-block px-4 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 mb-6">
            <span className="text-sky-400 text-xs font-bold tracking-wider uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
              Smart System Active
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-4">
            Next-Gen <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-400">
              Attendance
            </span>
          </h1>
          <p className="text-slate-400 text-lg mb-8 max-w-md leading-relaxed">
            Automated, secure, and instant biometric tracking via ESP32.
            Experience the future of student management.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-col gap-4"
        >
          <div className="flex items-center gap-4 bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl">
            <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-xl">
              <Fingerprint size={28} />
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg">
                Biometric Security
              </h3>
              <p className="text-slate-400 text-sm">
                Failsafe fingerprint recognition
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl translate-x-4 md:translate-x-8">
            <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <Zap size={28} />
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg">
                Real-time Sync
              </h3>
              <p className="text-slate-400 text-sm">
                Instant Firebase database updates
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl">
            <div className="p-3 bg-rose-500/20 text-rose-400 rounded-xl">
              <ShieldCheck size={28} />
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg">
                Anti-Proxy System
              </h3>
              <p className="text-slate-400 text-sm">
                Guaranteed attendance authenticity
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Hero;
