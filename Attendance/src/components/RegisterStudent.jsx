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

    // Listen for messages
    const listener = onValue(msgRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list = Object.values(data).map((item) => item.msg);
        setMessages(list);

        // Stop loading when enrollment finishes (success or error)
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

          // Clear form on success
          if (list.some((msg) => msg.includes("Enroll Success"))) {
            setName("");
            setRegNum("");
            setIndexNum("");
            setEmail("");
          }

          // Show error if enrollment failed
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
      // Write enrollment data to Firebase
      await set(ref(database, "/enrollData"), {
        name,
        regNum,
        indexNum,
        email,
      });

      // Trigger ESP32 to start enrollment
      await set(ref(database, "/systemState"), "ENROLL");
    } catch (err) {
      console.error("Firebase write error:", err);
      setLoading(false);
      setError("Failed to start enrollment. Check console for details.");
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
            className="border p-2 mb-2 w-full"
            disabled={loading}
          />
          <input
            type="text"
            placeholder="IndexNum"
            value={indexNum}
            onChange={(e) => setIndexNum(e.target.value)}
            className="border p-2 mb-2 w-full"
            disabled={loading}
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border p-2 mb-2 w-full"
            disabled={loading}
          />

          <div className="text-red-500 text-sm">{error}</div>

          <div className="flex items-center justify-between mt-4">
            <button
              onClick={startEnroll}
              disabled={loading || espStatus !== "ONLINE"}
              className={`px-5 py-2 rounded font-semibold ${
                loading || espStatus !== "ONLINE"
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-500 hover:bg-green-600 text-white"
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
                className={`w-3.5 h-3.5 border-2 rounded-full ${
                  espStatus === "ONLINE"
                    ? "bg-green-500 animate-pulse"
                    : "bg-red-500"
                }`}
              ></span>
              <span className="text-sm font-medium">{espStatus}</span>
            </div>
          </div>
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
