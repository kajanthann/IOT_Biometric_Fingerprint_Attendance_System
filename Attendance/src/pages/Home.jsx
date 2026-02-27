import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import heroImg from "../assets/hero2.png";
import img from "../assets/home.png";
import {
  Fingerprint,
  Wifi,
  Lock,
  BarChart,
  Users,
  Cloud,
  Clock,
  CheckCircle,
  Database,
  Cpu,
} from "lucide-react";
import Hero from "../components/Hero";

const Home = () => {
  const [isMedium, setIsMedium] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMedium(window.innerWidth >= 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const heroSteps = [
    {
      icon: <Fingerprint className="w-6 h-6 text-sky-400" />,
      text: "Scan Fingerprint",
      bg: "bg-sky-400/10", // light sky background
    },
    {
      icon: <Wifi className="w-6 h-6 text-indigo-400" />,
      text: "ESP32 Sends Data",
      bg: "bg-indigo-400/10", // light indigo background
    },
    {
      icon: <Lock className="w-6 h-6 text-rose-400" />,
      text: "Authentication",
      bg: "bg-rose-400/10", // light rose background
    },
    {
      icon: <BarChart className="w-6 h-6 text-emerald-400" />,
      text: "Dashboard Logging",
      bg: "bg-emerald-400/10", // light emerald background
    },
    {
      icon: <Users className="w-6 h-6 text-amber-400" />,
      text: "Attendance Recorded",
      bg: "bg-amber-400/10", // light amber background
    },
  ];

  const features = [
    {
      icon: <Fingerprint className="w-10 h-10 text-sky-400" />,
      title: "Biometric Authentication",
      desc: "AS608 fingerprint sensor ensures accurate and tamper-proof attendance.",
    },
    {
      icon: <Wifi className="w-10 h-10 text-indigo-400" />,
      title: "Wi-Fi Connectivity",
      desc: "ESP32 connects seamlessly to Firebase via 2.4GHz Wi-Fi network.",
    },
    {
      icon: <Cloud className="w-10 h-10 text-sky-400" />,
      title: "Firebase Integration",
      desc: "Real-time data synchronization between ESP32 and cloud database.",
    },
    {
      icon: <Clock className="w-10 h-10 text-amber-400" />,
      title: "NTP Time Sync",
      desc: "Ensures accurate timestamps for all attendance logs.",
    },
    {
      icon: <Database className="w-10 h-10 text-emerald-400" />,
      title: "Offline Mode",
      desc: "Locally stores attendance in EEPROM and auto-syncs when online.",
    },
    {
      icon: <CheckCircle className="w-10 h-10 text-sky-400" />,
      title: "Web Dashboard",
      desc: "React-based dashboard for student management and attendance tracking.",
    },
  ];

  const howItWorks = [
    {
      icon: <Fingerprint className="w-8 h-8 text-sky-400" />,
      title: "Enrollment",
      desc: "Admin registers student details via dashboard. ESP32 captures fingerprint and stores it locally and in Firebase.",
    },
    {
      icon: <Lock className="w-8 h-8 text-rose-400" />,
      title: "Attendance Verification",
      desc: "Students scan fingerprints. ESP32 compares with stored templates and logs attendance with timestamps.",
    },
    {
      icon: <BarChart className="w-8 h-8 text-emerald-400" />,
      title: "Dashboard Monitoring",
      desc: "Admins view real-time logs, manage students, and monitor system status via the React dashboard.",
    },
  ];

  const architecture = [
    {
      icon: <Cpu className="w-8 h-8 text-indigo-400" />,
      title: "Embedded System (ESP32)",
      list: [
        "ESP32 controls fingerprint, display, and Wi-Fi.",
        "AS608 Fingerprint Sensor for authentication.",
        "SH1107 OLED Display for real-time feedback.",
        "EEPROM stores offline attendance data.",
        "Firebase Realtime Database for cloud sync.",
      ],
    },
    {
      icon: <Cloud className="w-8 h-8 text-sky-400" />,
      title: "Web Dashboard (React)",
      list: [
        "Student enrollment and record management.",
        "Attendance monitoring and timetable import.",
        "Firebase Realtime Database integration.",
        "Responsive UI with Tailwind CSS.",
        "Admin authentication and real-time updates.",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 selection:bg-sky-500/30 font-sans">
      {/* Hero Section */}
      <header className="relative mt-8 mx-4 md:mx-15 rounded-3xl overflow-hidden border border-white/5 shadow-2xl bg-[#111827]">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-sky-500/20 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px] pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row items-center justify-between relative z-10">
          <div className="lg:w-1/2 p-8 md:p-12 space-y-8">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight">
                Smart Attendance <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-400">
                  System
                </span>
              </h1>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-lg text-slate-400 max-w-xl leading-relaxed"
            >
              IoT-enabled fingerprint biometric attendance tracking for
              classrooms, ensuring accuracy, security, and real-time cloud
              monitoring via ESP32.
            </motion.p>

            {/* Hero Steps Grid */}
            <motion.div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              {heroSteps.map((step, idx) => {
                // Determine light background based on icon color
                let bgColor = "";
                if (step.icon.props.className.includes("text-sky-400"))
                  bgColor = "bg-sky-400/20";
                else if (step.icon.props.className.includes("text-indigo-400"))
                  bgColor = "bg-indigo-400/20";
                else if (step.icon.props.className.includes("text-rose-400"))
                  bgColor = "bg-rose-400/20";
                else if (step.icon.props.className.includes("text-emerald-400"))
                  bgColor = "bg-emerald-400/20";
                else if (step.icon.props.className.includes("text-amber-400"))
                  bgColor = "bg-amber-400/20";

                return (
                  <motion.div
                    key={idx}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.4 + idx * 0.1, type: "spring" }}
                    className="flex items-center space-x-3 bg-white/1 backdrop-blur-md border border-white/5 p-1 rounded-2xl hover:bg-white/10 transition-colors shadow-lg"
                  >
                    <div
                      className={`p-2 rounded-xl shadow-inner flex items-center justify-center ${bgColor}`}
                    >
                      {step.icon}
                    </div>
                    <span className="text-sm font-semibold text-slate-200">
                      {step.text}
                    </span>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>

          <motion.div
            className="lg:w-1/2 w-full h-full relative"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >

            <img
              src={img}
              alt="System Interface Demo"
              className="w-full object-cover object-left h-[600px]"
              style={{ filter: "brightness(0.9) contrast(1.1)" }}
            />
          </motion.div>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
              Core Features
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-sky-500 to-indigo-500 mx-auto rounded-full"></div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: i * 0.1 }}
                className="p-8 rounded-3xl bg-[#1e293b]/50 backdrop-blur-sm border border-slate-700/50 hover:bg-[#1e293b] hover:border-sky-500/30 transition-all duration-300 group shadow-lg"
              >
                <div className="p-4 bg-slate-800/80 rounded-2xl inline-block mb-6 group-hover:scale-110 transition-transform duration-300 shadow-inner">
                  {f.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{f.title}</h3>
                <p className="text-slate-400 leading-relaxed text-sm">
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-[#0b1120] relative border-y border-slate-800/50">
        {/* Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-96 bg-sky-900/10 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="max-w-5xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
              How It Works
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-sky-500 to-indigo-500 mx-auto rounded-full"></div>
          </div>

          <div className="space-y-6">
            {howItWorks.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="rounded-3xl p-8 bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-slate-700/50 flex flex-col md:flex-row md:items-center gap-6 hover:border-sky-500/30 transition-colors shadow-lg"
              >
                <div className="flex-shrink-0 p-5 bg-black/40 rounded-2xl border border-white/5 shadow-inner">
                  {step.icon}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {step.title}
                  </h3>
                  <p className="text-slate-400 leading-relaxed">{step.desc}</p>
                </div>
                <div className="hidden md:block ml-auto opacity-10 font-bold text-8xl text-white select-none">
                  0{i + 1}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* System Architecture */}
      <section className="py-24 relative">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
              System Architecture
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-sky-500 to-indigo-500 mx-auto rounded-full"></div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {architecture.map((arch, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.2 }}
                className="p-8 md:p-10 rounded-3xl bg-[#1e293b]/30 border border-slate-700/50 shadow-xl relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-bl-full group-hover:bg-sky-500/10 transition-colors duration-500"></div>

                <div className="flex items-center space-x-4 mb-8">
                  <div className="p-4 bg-slate-800 rounded-2xl shadow-inner border border-white/5">
                    {arch.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-white">
                    {arch.title}
                  </h3>
                </div>

                <ul className="space-y-4">
                  {arch.list.map((li, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-sky-500/50 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-300">{li}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
