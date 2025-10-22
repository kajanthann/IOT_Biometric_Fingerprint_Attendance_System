import React, { useState, useEffect, useContext } from "react";
import { ref, set, onValue, off } from "firebase/database";
import { database } from "../firebase";
import { AppContext } from "../context/AppContext";

const RegisterStudent = () => {
  const [name, setName] = useState("");
  const [regNum, setRegNum] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { espStatus, darkMode } = useContext(AppContext);
  const primaryColor = "#02c986";

  const bgMain = darkMode ? "bg-gray-900" : "bg-white";
  const textMain = darkMode ? "text-gray-100" : "text-gray-900";
  const cardBg = darkMode ? "bg-gray-800" : "bg-white";
  const cardBorder = darkMode ? "border-gray-700" : "border-gray-300";
  const inputBg = darkMode ? "bg-gray-700/70" : "bg-gray-100";
  const inputText = darkMode ? "text-white" : "text-gray-900";
  const placeholderText = darkMode
    ? "placeholder-gray-400"
    : "placeholder-gray-500";
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
      } else setMessages([]);
    });

    return () => off(msgRef, "value", listener);
  }, []);

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

  return (
    <div className={`p-4 md:p-6 max-w-4xl mx-auto ${bgMain} ${textMain}`}>
      <h1
        className="text-2xl md:text-3xl font-bold mb-6 text-center"
        style={{ color: primaryColor }}
      >
        ESP32 Attendance System
      </h1>

      <div className="flex flex-col md:flex-row gap-4">
        {/* Enroll Section */}
        <div
          className={`flex-1 shadow-md rounded-xl p-4 border ${cardBorder} ${cardBg}`}
        >
          <h2 className="text-lg font-semibold mb-3">Enroll Student</h2>

          <div className="space-y-2">
            {["Name", "RegNum"].map((label, i) => {
              const setter = [setName, setRegNum][i];
              const value = [name, regNum][i];
              return (
                <input
                  key={i}
                  type="text"
                  placeholder={label}
                  value={value}
                  onChange={(e) => setter(e.target.value)}
                  disabled={loading}
                  className={`w-full px-3 py-2 rounded-md border ${cardBorder} ${inputBg} ${inputText} ${placeholderText} focus:outline-none focus:ring-2 focus:ring-[${primaryColor}]`}
                />
              );
            })}
          </div>

          {error && <div className="text-red-400 mt-1 text-sm">{error}</div>}

          <div className="flex items-center justify-between mt-5">
            {/* Enroll Button */}
            <div className="flex items-center gap-4">
              <button
                onClick={startEnroll}
                disabled={loading || espStatus !== "ONLINE"}
                className={`px-4 py-1 rounded-lg font-semibold text-white transition-all duration-200 ${
                  loading || espStatus !== "ONLINE"
                    ? "bg-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-[#01996f] to-[#02d88f] hover:from-[#02d88f] hover:to-[#01996f]"
                }`}
              >
                {loading ? (
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-4 h-4 border-2 border-t-2 border-t-green-500 border-gray-200 rounded-full animate-spin"></div>
                    Enrolling...
                  </div>
                ) : (
                  "Enroll"
                )}
              </button>

              {/* Cancel Button */}
              <button
                onClick={async () => {
                  try {
                    await set(ref(database, "/systemState"), "VERIFY");
                    setLoading(false);
                    setError("");
                    setMessages((prev) => [...prev, "Enrollment cancelled"]);
                  } catch (err) {
                    console.error("Failed to cancel enrollment:", err);
                    setError("Failed to cancel enrollment.");
                  }
                }}
                disabled={!loading} // Only active during enrollment
                className={`px-4 py-1 rounded-lg font-semibold text-white transition-all duration-200 ${
                  !loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-red-500 hover:bg-red-600"
                }`}
              >
                Cancel
              </button>
            </div>

            {/* ESP32 Status */}
            <div className="flex items-center gap-2 text-sm">
              <span
                className={`w-3 h-3 rounded-full border-2 border-white ${
                  espStatus === "ONLINE"
                    ? "bg-[#00ff88] animate-pulse"
                    : "bg-red-500"
                }`}
                style={{
                  boxShadow:
                    espStatus === "ONLINE"
                      ? `0 0 6px ${primaryColor}`
                      : "0 0 6px red",
                }}
              ></span>
              <span>{espStatus}</span>
            </div>
          </div>
        </div>

        {/* Messages Section */}
        <div
          className={`flex-1 shadow-md rounded-xl p-4 border ${cardBorder} ${cardBg}`}
        >
          <h2 className="text-lg font-semibold mb-2">Enrollment Messages</h2>
          <div
            className={`h-48 overflow-y-auto p-2 rounded-md border ${cardBorder} ${messageBg} ${messageText} font-mono text-sm`}
          >
            {messages.length === 0 ? (
              <div className="text-gray-400 italic text-xs">
                No messages yet...
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} className="mb-1 text-sm">
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
