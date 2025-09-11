import React from "react";
import { useNavigate } from "react-router-dom";

const Home = ( { token }) => {
  const navigate = useNavigate();


  return (
    <div className="min-h-screen flex flex-col p-15 bg-gradient-to-b from-indigo-50 to-white">
      {/* Hero Section */}
      <header className="flex flex-col md:flex-row rounded-3xl items-center justify-between py-16 px-8 text-white bg-[#02c986]">
        {/* Left: Title */}
        <div className="md:w-1/2 text-center md:text-left space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold">
            Smart Lecture Attendance System
          </h1>
          <p className="text-lg md:text-xl max-w-md">
            IoT-enabled fingerprint biometric attendance tracking for classrooms, 
            ensuring accuracy, security, and real-time monitoring.
          </p>
          <div className="mt-6 flex justify-center md:justify-start space-x-4">
            
            <button
              onClick={() => navigate(token ? "/dashboard" : "/login")}
              className="px-6 py-3 bg-indigo-500 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition"
            >
              View Dashboard
            </button>
          </div>
        </div>

        {/* Right: SVG Illustration */}
        <div className="md:w-1/2 mt-12 md:mt-0 flex justify-center">
          <svg
            width="350"
            height="350"
            viewBox="0 0 350 350"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Breadboard */}
            <rect x="50" y="200" width="250" height="20" fill="#ddd" stroke="#999" strokeWidth="2" rx="3"/>
            <text x="175" y="215" textAnchor="middle" fontSize="10" fill="#333">Breadboard</text>

            {/* ESP32 */}
            <rect x="130" y="150" width="90" height="50" fill="#3c8dbc" stroke="#000" strokeWidth="2" rx="5"/>
            <text x="175" y="180" textAnchor="middle" fontSize="12" fill="white">ESP32</text>

            {/* AS608 Fingerprint */}
            <rect x="60" y="100" width="70" height="40" fill="#f39c12" stroke="#000" strokeWidth="2" rx="5"/>
            <text x="95" y="125" textAnchor="middle" fontSize="10" fill="white">AS608</text>

            {/* OLED Display */}
            <rect x="220" y="100" width="70" height="40" fill="#27ae60" stroke="#000" strokeWidth="2" rx="5"/>
            <text x="255" y="125" textAnchor="middle" fontSize="10" fill="white">OLED</text>

            {/* LED */}
            <circle cx="175" cy="260" r="8" fill="#e74c3c"/>
            <text x="175" y="275" textAnchor="middle" fontSize="10" fill="#333">LED</text>

            {/* Wires */}
            <line x1="175" y1="200" x2="130" y2="150" stroke="#000" strokeWidth="2" />
            <line x1="175" y1="200" x2="220" y2="150" stroke="#000" strokeWidth="2" />
            <line x1="175" y1="200" x2="175" y2="260" stroke="#000" strokeWidth="2" />
            <line x1="95" y1="100" x2="130" y2="150" stroke="#000" strokeWidth="2" />
            <line x1="255" y1="100" x2="220" y2="150" stroke="#000" strokeWidth="2" />
          </svg>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-20 px-4 md:px-20 bg-white">
        <h2 className="text-3xl font-bold text-center mb-12">Features</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-6 border rounded-xl shadow hover:shadow-lg transition">
            <h3 className="text-xl font-semibold mb-3">Fingerprint Authentication</h3>
            <p>Secure and accurate attendance using the AS608 fingerprint sensor.</p>
          </div>
          <div className="p-6 border rounded-xl shadow hover:shadow-lg transition">
            <h3 className="text-xl font-semibold mb-3">Real-Time Attendance</h3>
            <p>Automatic, cloud-based attendance logging accessible from anywhere.</p>
          </div>
          <div className="p-6 border rounded-xl shadow hover:shadow-lg transition">
            <h3 className="text-xl font-semibold mb-3">Web Dashboard</h3>
            <p>Visualize attendance trends, export reports, and monitor classrooms in real-time.</p>
          </div>
        </div>
      </section>

      {/* System Overview Section */}
      <section className="py-20 px-4 md:px-20 bg-green-100">
        <h2 className="text-3xl font-bold text-center mb-12">System Overview</h2>
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <img
            src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
            alt="IoT Device"
            className="mx-auto w-80"
          />
          <div>
            <p className="mb-4">
              The system uses an ESP32 microcontroller integrated with the AS608 fingerprint sensor to authenticate students.
              Attendance data is sent securely over Wi-Fi to Firebase Realtime Database and displayed on a web dashboard for lecturers.
            </p>
            <p>
              This approach replaces manual roll calls, minimizes errors, prevents proxy attendance, and improves classroom efficiency.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
