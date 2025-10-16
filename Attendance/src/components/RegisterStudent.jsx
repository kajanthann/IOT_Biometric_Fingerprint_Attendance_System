import React, { useState, useEffect, useContext } from "react";
import { ref, set, onValue, off } from "firebase/database";
import { database } from "../firebase"; // Your initialized Firebase DB
import { AppContext } from "../context/AppContext";

const RegisterStudent = () => {
  const [name, setName] = useState("");
  const [regNum, setRegNum] = useState("");
  const [indexNum, setIndexNum] = useState("");
  const [email, setEmail] = useState("");
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

        const stopLoading = list.some((msg) =>
          [
            "Enroll Success",
            "Image error",
            "Invalid data",
            "Image fail",
            "2nd fail",
            "Model fail",
            "Store fail",
            "Already Enrolled",
          ].some((keyword) => msg.includes(keyword))
        );

        if (stopLoading) {
          setLoading(false);

          if (list.some((msg) => msg.includes("Enroll Success"))) {
            setName("");
            setRegNum("");
            setIndexNum("");
            setEmail("");
          }

          const failMsg = list.find((msg) =>
            [
              "Image error",
              "Invalid data",
              "Image fail",
              "2nd fail",
              "Model fail",
              "Store fail",
              "Already Enrolled",
            ].some((keyword) => msg.includes(keyword))
          );
          setError(failMsg || "");
        }
      } else {
        setMessages([]);
      }
    });

    return () => off(msgRef, "value", listener);
  }, []);

  const startEnroll = async () => {
    if (!name || !regNum || !indexNum || !email) {
      setError("Please fill all fields!");
      return;
    }

    setLoading(true);
    setMessages([]);
    setError("");

    try {
      await set(ref(database, "/enrollData"), {
        name,
        regNum,
        indexNum,
        email,
      });
      await set(ref(database, "/systemState"), "ENROLL");
    } catch (err) {
      console.error("Firebase write error:", err);
      setLoading(false);
      setError("Failed to start enrollment. Check console for details.");
    }
  };

  return (
    <div className="p-4 md:p-2 max-w-6xl mx-auto">
      <h1 className="text-2xl md:text-4xl font-bold mb-6 text-center text-[#02c986]">
        ESP32 Attendance System
      </h1>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Enroll Section */}
        <div className="flex-1 bg-gray-800 shadow-lg rounded-2xl p-6 border border-[#01996f]/40">
          <h2 className="text-xl font-semibold mb-4 text-white">Enroll Student</h2>

          <div className="space-y-3">
            {["Name", "RegNum", "IndexNum", "Email"].map((label, i) => {
              const setter = [setName, setRegNum, setIndexNum, setEmail][i];
              const value = [name, regNum, indexNum, email][i];
              return (
                <input
                  key={i}
                  type={label === "Email" ? "email" : "text"}
                  placeholder={label}
                  value={value}
                  onChange={(e) => setter(e.target.value)}
                  disabled={loading}
                  className="w-full px-4 py-2 rounded-lg bg-gray-700/70 text-white placeholder-gray-400 border border-gray-600 focus:ring-2 focus:ring-[#02c986] focus:border-[#02c986] transition-all duration-200"
                />
              );
            })}
          </div>

          {error && <div className="text-red-400 mt-2 text-sm">{error}</div>}

          <div className="flex items-center justify-between mt-4">
            <button
              onClick={startEnroll}
              disabled={loading || espStatus !== "ONLINE"}
              className={`px-6 py-2 rounded-xl font-semibold text-white transition-all duration-200 ${
                loading || espStatus !== "ONLINE"
                  ? "bg-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-[#01996f] to-[#02d88f] hover:from-[#02d88f] hover:to-[#01996f] shadow-lg"
              }`}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-4 border-t-4 border-t-green-500 border-gray-200 rounded-full animate-spin"></div>
                  Enrolling...
                </div>
              ) : (
                "Start Enroll"
              )}
            </button>

            <div className="flex items-center gap-2">
              <span
                className={`w-3.5 h-3.5 border-2 border-white rounded-full ml-2 mt-2 align-middle ${
                  espStatus === "ONLINE"
                    ? "bg-[#00ff88] animate-pulse"
                    : "bg-red-500"
                }`}
                style={{ boxShadow: espStatus === "ONLINE" ? `0 0 8px ${primaryColor}` : "0 0 8px red" }}
              ></span>
              <span className="text-sm font-medium text-gray-200">{espStatus}</span>
            </div>
          </div>
        </div>

        {/* Enrollment Messages */}
        <div className="flex-1 bg-gray-900 shadow-lg rounded-2xl md:p-6 border border-[#01996f]/40">
          <h2 className="text-xl font-semibold text-center md:text-start my-3 text-white">Enrollment Messages</h2>
          <div className="h-64 overflow-y-auto bg-gray-800 p-3 md:rounded-lg border border-gray-700 text-gray-100 font-mono text-sm">
            {messages.length === 0 ? (
              <div className="text-gray-400 italic">No messages yet...</div>
            ) : (
              messages.map((msg, index) => (
                <div key={index} className="mb-1">
                  {msg}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterStudent;
