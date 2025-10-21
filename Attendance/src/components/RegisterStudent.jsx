import React, { useState, useEffect, useContext } from "react";
import { ref, set, onValue, off } from "firebase/database";
import { database } from "../firebase";
import { AppContext } from "../context/AppContext";

const RegisterStudent = () => {
  const [name, setName] = useState("");
  const [regNum, setRegNum] = useState("");
  const [indexNum, setIndexNum] = useState("");
  const [email, setEmail] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { espStatus, darkMode } = useContext(AppContext);

  const primaryColor = "#02c986";

  // Theme-aware classes
  const bgMain = darkMode ? "bg-gray-900" : "bg-white";
  const textMain = darkMode ? "text-gray-100" : "text-gray-900";
  const cardBg = darkMode ? "bg-gray-800" : "bg-white";
  const cardBorder = darkMode ? "border-gray-700" : "border-gray-300";
  const inputBg = darkMode ? "bg-gray-700/70" : "bg-gray-100";
  const inputText = darkMode ? "text-white" : "text-gray-900";
  const placeholderText = darkMode ? "placeholder-gray-400" : "placeholder-gray-500";
  const messageBg = darkMode ? "bg-gray-800" : "bg-gray-100";
  const messageText = darkMode ? "text-gray-100" : "text-gray-900";

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
    <div className={`p-4 md:p-2 max-w-6xl mx-auto ${bgMain} ${textMain}`}>
      <h1 className="text-2xl lg:text-4xl font-bold mb-6 text-center" style={{ color: primaryColor }}>
        ESP32 Attendance System
      </h1>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Enroll Section */}
        <div className={`flex-1 shadow-lg rounded-2xl p-6 border ${cardBorder} ${cardBg}`}>
          <h2 className="text-xl font-semibold mb-4" style={{ color: darkMode ? "#fff" : "#000" }}>
            Enroll Student
          </h2>

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
                  className={`w-full px-4 py-2 rounded-lg border ${cardBorder} ${inputBg} ${inputText} ${placeholderText} focus:ring-2 focus:ring-[#02c986] focus:border-[#02c986] transition-all duration-200`}
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
                  espStatus === "ONLINE" ? "bg-[#00ff88] animate-pulse" : "bg-red-500"
                }`}
                style={{
                  boxShadow:
                    espStatus === "ONLINE"
                      ? `0 0 8px ${primaryColor}`
                      : "0 0 8px red",
                }}
              ></span>
              <span className="text-sm font-medium" style={{ color: darkMode ? "#fff" : "#000" }}>
                {espStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Enrollment Messages */}
        <div className={`flex-1 shadow-lg rounded-2xl md:p-6 border ${cardBorder} ${cardBg}`}>
          <h2 className="text-xl font-semibold text-center md:text-start my-3" style={{ color: darkMode ? "#fff" : "#000" }}>
            Enrollment Messages
          </h2>
          <div className={`h-64 overflow-y-auto p-3 md:rounded-lg border ${cardBorder} ${messageBg} ${messageText} font-mono text-sm`}>
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
