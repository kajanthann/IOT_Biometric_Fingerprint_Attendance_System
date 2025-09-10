import React, { useState, useEffect } from "react";
import { ref, set, onValue, off } from "firebase/database";
import { database } from "../firebase"; // Your initialized Firebase DB

const RegisterStudent = () => {
  const [name, setName] = useState("");
  const [regNum, setRegNum] = useState("");
  const [indexNum, setIndexNum] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const msgRef = ref(database, "/messages");
    const listener = onValue(msgRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list = Object.values(data).map((item) => item.msg);
        setMessages(list);

        // Stop loading when enrollment finishes (success/fail message)
        if (
          list.some(
            (msg) => msg.includes("Enroll Success") || msg.includes("fail")
          )
        ) {
          setLoading(false);
        }
      } else {
        setMessages([]);
      }
    });
    return () => off(msgRef, "value", listener);
  }, []);

  const startEnroll = async () => {
    if (!name || !regNum || !indexNum) {
      alert("Please fill all fields!");
      return;
    }
    setLoading(true); // Start loading
    setMessages([]); // Clear previous messages

    try {
      await set(ref(database, "/enrollData"), { name, regNum, indexNum });
      await set(ref(database, "/systemState"), "ENROLL");

      // Don't clear input fields yet — wait until enrollment finishes
      // Inputs can be cleared automatically when success message comes
    } catch (error) {
      console.error("Firebase write error:", error);
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">ESP32 Attendance System</h1>

      <div className="flex flex-col md:flex-row gap-4">
        {/* Enroll Section */}
        <div className="mb-6 border p-4 rounded w-full md:w-1/2">
          <h2 className="font-semibold mb-2">Enroll Student</h2>
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border p-2 mb-2 w-full"
            disabled={loading}
          />
          <input
            type="text"
            placeholder="RegNum"
            value={regNum}
            onChange={(e) => setRegNum(e.target.value)}
            className="border p-2 my-2 w-full"
            disabled={loading}
          />
          <input
            type="text"
            placeholder="IndexNum"
            value={indexNum}
            onChange={(e) => setIndexNum(e.target.value)}
            className="border p-2 my-2 w-full"
            disabled={loading}
          />
          <button
            className={`px-4 py-2 mt-3 rounded ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-500 hover:bg-green-600 text-white"
            }`}
            onClick={startEnroll}
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center gap-2 justify-center">
                <div className="w-5 h-5 border-4 border-t-4 border-t-green-500 border-gray-200 rounded-full animate-spin"></div>
                Enrolling...
              </div>
            ) : (
              "Start Enroll"
            )}
          </button>
        </div>

        {/* Enrollment Messages */}
        <div className="border p-4 rounded w-full md:w-1/2">
          <h2 className="font-semibold mb-2">Enrollment Messages</h2>
          <div className="h-52 overflow-y-auto border p-2 bg-gray-900">
            {messages.length === 0 ? (
              <div className="text-gray-100">No messages yet...</div>
            ) : (
              messages.map((msg, index) => (
                <div key={index} className="mb-1 text-gray-100">
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
