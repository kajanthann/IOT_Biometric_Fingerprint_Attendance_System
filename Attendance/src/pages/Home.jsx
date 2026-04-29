import React, { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import img from "../assets/Gemini_Generated_Image_r7uqa1r7uqa1r7uq.png";
import {
  Fingerprint,
  Wifi,
  Lock,
  BarChart3,
  Users,
  Cloud,
  Clock,
  CheckCircle,
  Database,
  Cpu,
  Radio,
  ShieldCheck,
  MonitorSmartphone,
  Zap,
  ArrowRight,
  Globe,
  HardDrive,
  Server,
  Activity,
  BookOpen,
  Calendar,
} from "lucide-react";

/* ─── Animated counter ──────────────────────────────────────────── */
const Counter = ({ end, suffix = "", duration = 2000 }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const isFloat = String(end).includes(".");
    const steps = 60;
    const interval = duration / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(isFloat ? +(end * eased).toFixed(1) : Math.floor(end * eased));
      if (step >= steps) {
        clearInterval(timer);
        setCount(end);
      }
    }, interval);
    return () => clearInterval(timer);
  }, [inView, end, duration]);

  return <span ref={ref}>{count}{suffix}</span>;
};

/* ─── Section heading ───────────────────────────────────────────── */
const SectionHead = ({ label, title }) => (
  <div className="text-center mb-16">
    {label && (
      <span className="inline-block mb-3 px-3 py-1 rounded-full text-xs font-mono font-semibold tracking-widest uppercase border border-sky-500/30 text-sky-400 bg-sky-500/10">
        {label}
      </span>
    )}
    <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 tracking-tight">
      {title}
    </h2>
    <div className="w-20 h-0.5 bg-gradient-to-r from-sky-500 to-indigo-500 mx-auto rounded-full" />
  </div>
);

/* ─── Data ──────────────────────────────────────────────────────── */
const heroSteps = [
  { icon: Fingerprint, text: "Scan Fingerprint",       color: "text-sky-400",     bg: "bg-sky-400/15"     },
  { icon: Wifi,        text: "ESP32 Sends Data",        color: "text-indigo-400",  bg: "bg-indigo-400/15"  },
  { icon: Radio,       text: "MQTT → Node.js",          color: "text-violet-400",  bg: "bg-violet-400/15"  },
  { icon: Lock,        text: "Auth & Deduplication",    color: "text-rose-400",    bg: "bg-rose-400/15"    },
  { icon: Cloud,       text: "Firebase Sync",           color: "text-cyan-400",    bg: "bg-cyan-400/15"    },
  { icon: BarChart3,   text: "Dashboard Updated",       color: "text-emerald-400", bg: "bg-emerald-400/15" },
];

const stats = [
  { value: 1,    suffix: "s",   label: "Max Sync Latency",      icon: Zap,        color: "text-sky-400"     },
  { value: 99,   suffix: "%",   label: "Fingerprint Accuracy",  icon: ShieldCheck, color: "text-emerald-400" },
  { value: 50,   suffix: "",    label: "Students per Device",   icon: Users,      color: "text-indigo-400"  },
  { value: 30,   suffix: "",    label: "Offline Record Buffer", icon: HardDrive,  color: "text-amber-400"   },
];

const features = [
  { icon: Fingerprint,      color: "text-sky-400",     title: "Biometric Auth",         desc: "AS608 fingerprint sensor provides >99% accurate, tamper-proof attendance with local template storage."                },
  { icon: Radio,            color: "text-violet-400",  title: "MQTT over TLS",          desc: "Secure SSL/TLS encrypted MQTT on port 8883 ensures data integrity between ESP32 and Node.js bridge."              },
  { icon: Cloud,            color: "text-cyan-400",    title: "Firebase Realtime DB",   desc: "Sub-second data propagation to Firebase cloud with structured collections for students, attendance, and modules."  },
  { icon: HardDrive,        color: "text-amber-400",   title: "Offline EEPROM Mode",    desc: "4 KB EEPROM buffers up to 30 attendance records locally and auto-syncs when connectivity is restored."            },
  { icon: Clock,            color: "text-rose-400",    title: "NTP Time Sync",          desc: "IST (+5:30) timestamps via NTP with hourly re-sync and server-side validation rejecting clocks before 2020."      },
  { icon: MonitorSmartphone,color: "text-emerald-400", title: "React Web Dashboard",    desc: "Vite-powered dashboard with Recharts analytics, CSV export, timetable view, and module-level attendance reports."  },
  { icon: BookOpen,         color: "text-indigo-400",  title: "Module Tracking",        desc: "Per-course enrollment, attendance rates, and instructor-level reporting across multiple modules simultaneously."    },
  { icon: Calendar,         color: "text-sky-400",     title: "Timetable Integration",  desc: "Schedule-aware analysis flags expected vs actual attendance with day-wise and module-wise breakdowns."             },
];

const howItWorks = [
  {
    icon: Fingerprint, color: "text-sky-400", num: "01",
    title: "Enrollment",
    desc: "Admin registers student name, registration number, and fingerprint ID via the web dashboard. The ESP32 captures the biometric template using the AS608 sensor and persists it in local EEPROM and Firebase simultaneously.",
  },
  {
    icon: Lock, color: "text-rose-400", num: "02",
    title: "Attendance Verification",
    desc: "Students place their finger on the sensor. ESP32 matches against stored templates, timestamps the event via NTP (IST), and publishes a JSON payload to the `fp/attendance` MQTT topic. The Node.js server validates, deduplicates, and writes to Firebase.",
  },
  {
    icon: BarChart3, color: "text-emerald-400", num: "03",
    title: "Dashboard Monitoring",
    desc: "Admins access real-time logs, filter by date/module/status, export CSV reports, and view analytics via the React dashboard. Firebase listeners push live updates without page refresh.",
  },
];

const mqttTopics = [
  { topic: "fp/attendance",  dir: "ESP32 → Server", payload: "{ studentId, name, regNum, timestamp }",  purpose: "Submit attendance record"         },
  { topic: "fp/enrolled",    dir: "Server → ESP32", payload: "{ id, name, fingerprintId }",             purpose: "Sync enrolled students"           },
  { topic: "fp/heartbeat",   dir: "ESP32 → Server", payload: "{ uptime, heapFree }",                   purpose: "Keep-alive signal"                },
  { topic: "fp/message",     dir: "Server → ESP32", payload: "{ type, text }",                         purpose: "Display message on OLED"          },
  { topic: "fp/enrollData",  dir: "Server → ESP32", payload: "{ id, name }",                           purpose: "Enrollment data sync"             },
  { topic: "fp/stateAck",    dir: "ESP32 → Server", payload: "{ ack }",                                purpose: "Acknowledge state change"         },
];

const layers = [
  {
    icon: Cpu, color: "text-indigo-400", border: "border-indigo-500/30", glow: "bg-indigo-500/5",
    title: "Hardware Layer — ESP32",
    badge: "Embedded Firmware (C++ / PlatformIO)",
    items: [
      "AS608 Fingerprint Sensor (template matching)",
      "SH1107 128×128 OLED real-time feedback",
      "EEPROM: 50 students · 30 offline records",
      "NTP sync every hour (IST UTC+5:30)",
      "MQTT over SSL/TLS (port 8883)",
      "Green/Red LED attendance indicators",
    ],
  },
  {
    icon: Server, color: "text-violet-400", border: "border-violet-500/30", glow: "bg-violet-500/5",
    title: "Backend Layer — Node.js",
    badge: "MQTT–Firebase Bridge Server",
    items: [
      "Subscribes to `fp/attendance` MQTT topic",
      "Timestamp validation (rejects <2020, >5min future)",
      "Deduplication prevents double-marking",
      "firebase-admin SDK writes to Realtime DB",
      "ISO-8601 IST timezone normalization",
      "Graceful error handling & reconnect logic",
    ],
  },
  {
    icon: Globe, color: "text-sky-400", border: "border-sky-500/30", glow: "bg-sky-500/5",
    title: "Frontend Layer — React",
    badge: "Web Dashboard (Vite + Tailwind)",
    items: [
      "Admin login via Firebase Authentication",
      "Student CRUD with fingerprint ID mapping",
      "Attendance view: date / month / year filters",
      "Recharts analytics & CSV export (PapaParse)",
      "Timetable & module-wise attendance reports",
      "Responsive Tailwind + Framer Motion UI",
    ],
  },
];

const techStack = [
  { name: "React 19",        color: "sky"     },
  { name: "Vite 7",         color: "indigo"  },
  { name: "TailwindCSS 4",  color: "cyan"    },
  { name: "Framer Motion",  color: "violet"  },
  { name: "Firebase RTD",   color: "amber"   },
  { name: "Recharts",       color: "emerald" },
  { name: "Node.js",        color: "green"   },
  { name: "MQTT 5",         color: "rose"    },
  { name: "ESP32",          color: "indigo"  },
  { name: "AS608 Sensor",   color: "sky"     },
  { name: "PlatformIO",     color: "violet"  },
  { name: "ArduinoJson",    color: "amber"   },
];

const colorMap = {
  sky:     { badge: "bg-sky-500/10 border-sky-500/30 text-sky-300"         },
  indigo:  { badge: "bg-indigo-500/10 border-indigo-500/30 text-indigo-300" },
  cyan:    { badge: "bg-cyan-500/10 border-cyan-500/30 text-cyan-300"       },
  violet:  { badge: "bg-violet-500/10 border-violet-500/30 text-violet-300" },
  amber:   { badge: "bg-amber-500/10 border-amber-500/30 text-amber-300"    },
  emerald: { badge: "bg-emerald-500/10 border-emerald-500/30 text-emerald-300" },
  green:   { badge: "bg-green-500/10 border-green-500/30 text-green-300"    },
  rose:    { badge: "bg-rose-500/10 border-rose-500/30 text-rose-300"       },
};

/* ─── Component ─────────────────────────────────────────────────── */
const Home = () => {
  return (
    <div className="min-h-screen bg-[#080e1a] text-slate-200 font-sans selection:bg-sky-500/30 overflow-x-hidden">

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <header className="relative mt-10 mx-4 md:mx-15 rounded-3xl overflow-hidden border border-white/5 shadow-2xl bg-gradient-to-br from-[#0d1528] to-[#0a1020]">
        {/* decorative glows */}
        <div className="absolute top-0 right-0 -mt-24 -mr-24 w-96 h-96 bg-sky-600/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-24 -ml-24 w-80 h-80 bg-indigo-600/15 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-px h-4/5 bg-gradient-to-b from-transparent via-sky-500/10 to-transparent hidden lg:block" />

        <div className="flex flex-col lg:flex-row items-center relative z-10">
          {/* left */}
          <div className="lg:w-1/2 p-8  space-y-8">
            {/* pill */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-semibold border border-sky-500/30 text-sky-400 bg-sky-500/10 tracking-widest uppercase">
                <Activity className="w-3 h-3" /> IoT · Biometric · Real-time
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white leading-tight tracking-tight"
            >
              Smart Fingerprint<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-cyan-400 to-indigo-400">
                Attendance System
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-base text-slate-400 max-w-xl leading-relaxed"
            >
              An end-to-end IoT solution — ESP32 biometric hardware, a Node.js MQTT–Firebase bridge,
              and a React web dashboard — delivering automated, tamper-proof classroom attendance
              with sub-second cloud synchronization.
            </motion.p>

            {/* flow steps */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45, duration: 0.5 }}
              className="grid grid-cols-2 sm:grid-cols-3 gap-3"
            >
              {heroSteps.map((s, i) => {
                const Icon = s.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ x: -16, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.5 + i * 0.07, type: "spring", stiffness: 120 }}
                    className="flex items-center gap-2.5 bg-white/[0.03] border border-white/5 p-2.5 rounded-2xl hover:bg-white/[0.07] transition-colors group cursor-default"
                  >
                    <div className={`p-2 rounded-xl flex-shrink-0 ${s.bg}`}>
                      <Icon className={`w-4 h-4 ${s.color}`} />
                    </div>
                    <span className="text-xs font-semibold text-slate-300 leading-tight">{s.text}</span>
                  </motion.div>
                );
              })}
            </motion.div>

          </div>

          {/* right image */}
          <motion.div
            className="lg:w-1/2 w-full hidden md:block"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <img
              src={img}
              alt="System Interface Demo"
              className="w-full object-cover object-left h-[550px]"
              style={{ filter: "brightness(0.88) contrast(1.05)" }}
            />
          </motion.div>
        </div>
      </header>

      {/* ── STATS ────────────────────────────────────────────────── */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="p-6 rounded-2xl bg-[#0d1528] border border-slate-800/80 text-center group hover:border-sky-500/30 transition-colors"
                >
                  <Icon className={`w-6 h-6 ${s.color} mx-auto mb-3 opacity-80`} />
                  <p className={`text-3xl font-extrabold ${s.color} font-mono`}>
                    <Counter end={s.value} suffix={s.suffix} />
                  </p>
                  <p className="text-xs text-slate-500 mt-1 leading-snug">{s.label}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────── */}
      <section className="py-20 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-950/30 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <SectionHead label="Capabilities" title="Core Features" />
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ delay: i * 0.05 }}
                  className="p-6 rounded-2xl bg-[#0d1528]/80 border border-slate-800/60 hover:border-sky-500/25 hover:bg-[#0d1528] transition-all duration-300 group"
                >
                  <div className="p-3 bg-slate-800/70 rounded-xl inline-block mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Icon className={`w-6 h-6 ${f.color}`} />
                  </div>
                  <h3 className="text-sm font-bold text-white mb-2">{f.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────── */}
      <section className="py-20 bg-[#060c18] border-y border-slate-800/50 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-950/20 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-5xl mx-auto px-6 relative z-10">
          <SectionHead label="Workflow" title="How It Works" />
          <div className="space-y-5">
            {howItWorks.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -24 : 24 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="rounded-2xl p-7 bg-gradient-to-br from-slate-800/30 to-slate-900/30 border border-slate-700/50 flex flex-col md:flex-row md:items-center gap-6 hover:border-sky-500/25 transition-colors group"
                >
                  <div className="flex-shrink-0 p-4 bg-black/40 rounded-2xl border border-white/5">
                    <Icon className={`w-7 h-7 ${step.color}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-1.5">{step.title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">{step.desc}</p>
                  </div>
                  <div className="hidden md:block ml-auto font-black text-7xl text-white/5 select-none group-hover:text-white/8 transition-colors font-mono">
                    {step.num}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── SYSTEM ARCHITECTURE ──────────────────────────────────── */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-6">
          <SectionHead label="Architecture" title="Three-Layer System" />
          <div className="grid md:grid-cols-3 gap-6">
            {layers.map((layer, i) => {
              const Icon = layer.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.15 }}
                  className={`p-7 rounded-2xl bg-[#0d1528]/60 border ${layer.border} relative overflow-hidden group`}
                >
                  <div className={`absolute top-0 right-0 w-40 h-40 ${layer.glow} rounded-bl-full pointer-events-none group-hover:opacity-150 transition-opacity duration-500`} />
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 bg-slate-800 rounded-xl border border-white/5">
                      <Icon className={`w-6 h-6 ${layer.color}`} />
                    </div>
                    <h3 className="text-base font-bold text-white leading-snug">{layer.title}</h3>
                  </div>
                  <p className="text-xs font-mono text-slate-500 mb-5 pl-1">{layer.badge}</p>
                  <ul className="space-y-3">
                    {layer.items.map((li, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <CheckCircle className="w-4 h-4 text-sky-500/50 mt-0.5 flex-shrink-0" />
                        <span className="text-xs text-slate-400 leading-snug">{li}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── MQTT TOPICS TABLE ────────────────────────────────────── */}
      <section className="py-20 bg-[#060c18] border-y border-slate-800/50">
        <div className="max-w-5xl mx-auto px-6">
          <SectionHead label="Communication Protocol" title="MQTT Topics" />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-slate-800/80 overflow-hidden"
          >
            {/* table header */}
            <div className="grid grid-cols-3 bg-[#0d1528] px-5 py-3 text-xs font-semibold font-mono text-slate-500 uppercase tracking-wider border-b border-slate-800">
              <span>Topic</span>
              <span>Direction</span>
              <span>Purpose</span>
            </div>
            {mqttTopics.map((row, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="grid grid-cols-3 items-start px-5 py-4 border-b border-slate-800/50 last:border-0 hover:bg-white/[0.02] transition-colors gap-3"
              >
                <code className="text-sky-400 text-xs font-mono break-all">{row.topic}</code>
                <span className={`text-xs px-2 py-0.5 rounded-full self-start font-mono font-semibold inline-block w-fit ${
                  row.dir.startsWith("ESP32")
                    ? "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                    : "bg-sky-500/10 text-sky-300 border border-sky-500/20"
                }`}>
                  {row.dir}
                </span>
                <span className="text-xs text-slate-400 leading-relaxed">{row.purpose}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* payload note */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-4 p-4 rounded-xl bg-slate-800/30 border border-slate-700/40 flex items-start gap-3"
          >
            <Radio className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-slate-500 leading-relaxed">
              All MQTT messages use JSON payloads over <strong className="text-slate-400">SSL/TLS port 8883</strong>.
              The Node.js bridge validates timestamps (rejects &gt;5 min future or before 2020),
              deduplicates records, and normalises to ISO-8601 IST before writing to Firebase.
            </p>
          </motion.div>
        </div>
      </section>


    </div>
  );
};

export default Home;