import React from "react";
import { useNavigate } from "react-router-dom";
import heroImg from "../assets/hero2.png";
import { motion } from "framer-motion";
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

const Home = ({ token }) => {
  const navigate = useNavigate();

  const heroSteps = [
    {
      icon: <Fingerprint className="w-6 h-6 text-[#01996f]" />,
      text: "Scan Fingerprint",
    },
    {
      icon: <Wifi className="w-6 h-6 text-[#01996f]" />,
      text: "ESP32 Sends Data",
    },
    {
      icon: <Lock className="w-6 h-6 text-[#01996f]" />,
      text: "Authentication",
    },
    {
      icon: <BarChart className="w-6 h-6 text-[#01996f]" />,
      text: "Dashboard Logging",
    },
    {
      icon: <Users className="w-6 h-6 text-[#01996f]" />,
      text: "Attendance Recorded",
    },
  ];

  const features = [
    {
      icon: <Fingerprint className="w-10 h-10 text-[#01996f]" />,
      title: "Biometric Authentication",
      desc: "AS608 fingerprint sensor ensures accurate and tamper-proof attendance.",
    },
    {
      icon: <Wifi className="w-10 h-10 text-[#01996f]" />,
      title: "Wi-Fi Connectivity",
      desc: "ESP32 connects seamlessly to Firebase via 2.4GHz Wi-Fi network.",
    },
    {
      icon: <Cloud className="w-10 h-10 text-[#01996f]" />,
      title: "Firebase Integration",
      desc: "Real-time data synchronization between ESP32 and cloud database.",
    },
    {
      icon: <Clock className="w-10 h-10 text-[#01996f]" />,
      title: "NTP Time Sync",
      desc: "Ensures accurate timestamps for all attendance logs.",
    },
    {
      icon: <Database className="w-10 h-10 text-[#01996f]" />,
      title: "Offline Mode",
      desc: "Locally stores attendance in EEPROM and auto-syncs when online.",
    },
    {
      icon: <CheckCircle className="w-10 h-10 text-[#01996f]" />,
      title: "Web Dashboard",
      desc: "React-based dashboard for student management and attendance tracking.",
    },
  ];

  const howItWorks = [
    {
      icon: <Fingerprint className="w-6 h-6 text-[#01996f]" />,
      title: "Enrollment",
      desc: "Admin registers student details via dashboard. ESP32 captures fingerprint and stores it locally and in Firebase.",
    },
    {
      icon: <Lock className="w-6 h-6 text-[#01996f]" />,
      title: "Attendance Verification",
      desc: "Students scan fingerprints. ESP32 compares with stored templates and logs attendance with timestamps.",
    },
    {
      icon: <BarChart className="w-6 h-6 text-[#01996f]" />,
      title: "Dashboard Monitoring",
      desc: "Admins view real-time logs, manage students, and monitor system status via the React dashboard.",
    },
  ];

  const architecture = [
    {
      icon: <Cpu className="w-6 h-6 text-[#01996f]" />,
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
      icon: <Cloud className="w-6 h-6 text-[#01996f]" />,
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
    <div className="min-h-screen flex flex-col bg-white text-gray-800">
      {/* Hero Section */}
      <header className="flex flex-col lg:flex-row rounded-3xl items-center justify-between bg-gradient-to-r from-[#d9f9ed] to-[#b6f5df] shadow-md m-10 overflow-hidden">
        <div className="lg:w-1/2 text-center md:text-left px-4 md:px-10 space-y-5">
          <motion.h1
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="text-3xl mt-3 md:text-5xl text-[#01996f] font-bold"
          >
            Smart Attendance System
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-gray-700 md:text-lg"
          >
            IoT-enabled fingerprint biometric attendance tracking for
            classrooms, ensuring accuracy, security, and real-time monitoring.
          </motion.p>

          {/* Hero Steps */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, staggerChildren: 0.2 }}
            className="relative w-full h-64 md:h-80"
          >
            {heroSteps.map((step, idx) => {
              // Calculate position: progressively move diagonally
              const top = `${idx * 18}%`; // adjust spacing
              const left = `${idx * 8}%`;

              return (
                <motion.div
                  key={idx}
                  initial={{ x: -50, y: 20, opacity: 0 }}
                  animate={{ x: 0, y: 0, opacity: 1 }}
                  transition={{
                    delay: idx * 0.3,
                    type: "spring",
                    stiffness: 120,
                  }}
                  className="absolute flex items-center space-x-3 p-3"
                  style={{ top, left }}
                >
                  <div className="bg-green-50 p-3 rounded-full flex items-center justify-center shadow-md">
                    {step.icon}
                  </div>
                  <span className="font-medium text-gray-800">{step.text}</span>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        <motion.div
          className="lg:w-1/2 mt-10 lg:mt-0"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1 }}
        >
          <img
            src={heroImg}
            alt="Hero"
            className="w-full rounded-b-3xl lg:rounded-b-none md:rounded-r-3xl shadow-lg"
          />
        </motion.div>
      </header>

      {/* Features Section */}
      <section className="py-16 bg-[#f8fafc]">
        <h2 className="text-3xl font-bold text-center mb-12 text-[#01996f]">
          Key Features
        </h2>
        <div className="grid md:grid-cols-3 gap-8 px-6 max-w-6xl mx-auto">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl border border-gray-100 transition"
            >
              <div className="flex justify-center mb-4">{f.icon}</div>
              <h3 className="text-xl font-semibold mb-2 text-[#01996f]">
                {f.title}
              </h3>
              <p className="text-gray-600">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-8 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12 text-[#01996f]">
          How It Works
        </h2>
        <div className="space-y-8 text-gray-700">
          {howItWorks.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.2 }}
              className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 flex items-start space-x-3"
            >
              {step.icon}
              <div>
                <h3 className="text-2xl font-semibold text-[#01996f]">
                  {step.title}
                </h3>
                <p className="mt-1">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* System Architecture */}
      <section className="py-16 bg-[#f8fafc]">
        <h2 className="text-3xl font-bold text-center mb-10 text-[#01996f]">
          System Architecture
        </h2>
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 px-6">
          {architecture.map((arch, i) => (
            <div
              key={i}
              className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100"
            >
              <div className="flex items-center space-x-2 mb-4">
                {arch.icon}
                <h3 className="text-2xl font-semibold text-[#01996f]">
                  {arch.title}
                </h3>
              </div>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                {arch.list.map((li, idx) => (
                  <li key={idx}>{li}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
