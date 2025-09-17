import React from "react";
import { useNavigate } from "react-router-dom";
import heroImg from "../assets/hero2.png";
import Hero from "../components/Hero";

const Home = ({ token }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col p-3 md:p-15">
      {/* Hero Section */}
      <header className="flex flex-col lg:flex-row rounded-3xl items-center justify-between bg-[#8ef4cc]">
        {/* Left: Title + Emojis Flow */}
        <div className="lg:w-1/2 text-center md:text-left px-4 md:px-20">
          <h1 className="text-3xl md:text-5xl text-[#01996f] font-bold">
            Smart Attendance System
          </h1>
          <p className="text md:text-xl my-5">
            IoT-enabled fingerprint biometric attendance tracking for
            classrooms, ensuring accuracy, security, and real-time monitoring.
          </p>

          {/* Emoji Process Visualization */}
          <div className="my-5 lg:mt-8 space-y-2 text-left md:text-xl font-medium text-gray-700">
            <p className="ml-5">
              → 👆🖐️  <span className="ml-2">Scan Fingerprint</span>
            </p>
            <p className="ml-10">
              → 📡🌐 <span className="ml-2">ESP32 Sends Data</span>
            </p>
            <p className="ml-15">
              → 🔐🆔 <span className="ml-2">Authentication</span>
            </p>
            <p className="ml-20">
              → 📊🖥️ <span className="ml-2">Dashboard Logging</span>
            </p>
            <p className="ml-25">
              → 👩‍🎓👨‍🎓 <span className="ml-2">Attendance Recorded</span>
            </p>
          </div>
        </div>

        {/* Right: Hero Image */}
        <div className="lg:w-1/2">
          <img src={heroImg} alt="Hero" className="w-full md:rounded-r-3xl" />
        </div>
      </header>

      {/* Features Section */}
      <section className="py-20 px-4 md:px-20 bg-white">
        <h2 className="text-3xl font-bold text-center mb-12">Features</h2>
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="p-6 border rounded-xl shadow hover:shadow-lg transition">
            <h3 className="text-xl font-semibold mb-3">
              Fingerprint Authentication
            </h3>
            <p>
              Secure and accurate attendance using the AS608 fingerprint sensor.
            </p>
          </div>
          <div className="p-6 border rounded-xl shadow hover:shadow-lg transition">
            <h3 className="text-xl font-semibold mb-3">Real-Time Attendance</h3>
            <p>
              Automatic, cloud-based attendance logging accessible from
              anywhere.
            </p>
          </div>
          <div className="p-6 border rounded-xl shadow hover:shadow-lg transition">
            <h3 className="text-xl font-semibold mb-3">Web Dashboard</h3>
            <p>
              Visualize attendance trends, export reports, and monitor
              classrooms in real-time.
            </p>
          </div>
        </div>
      </section>

      <Hero />

      {/* System Overview Section */}
      <section className="py-20 px-4 md:px-20 bg-green-100">
        <h2 className="text-3xl font-bold text-center mb-12">
          System Overview
        </h2>
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <img
            src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
            alt="IoT Device"
            className="mx-auto w-80"
          />
          <div>
            <p className="mb-4">
              The system uses an ESP32 microcontroller integrated with the AS608
              fingerprint sensor to authenticate students. Attendance data is
              sent securely over Wi-Fi to Firebase Realtime Database and
              displayed on a web dashboard for lecturers.
            </p>
            <p>
              This approach replaces manual roll calls, minimizes errors,
              prevents proxy attendance, and improves classroom efficiency.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
