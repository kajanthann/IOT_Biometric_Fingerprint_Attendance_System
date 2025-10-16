import React, { useState, useContext } from "react";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { AppContext } from "../context/AppContext";

const Login = ({ setToken, setAdminEmail }) => {
  const { darkMode } = useContext(AppContext);
  const primaryColor = "#01996f";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const auth = getAuth();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const ADMIN_EMAIL = "smarfingeriot32@gmail.com";
      if (user.email !== ADMIN_EMAIL) {
        setError("You are not authorized as admin.");
        await auth.signOut();
        setLoading(false);
        return;
      }

      setToken(user.uid);
      setAdminEmail(user.email);
    } catch (err) {
      console.error(err);
      setError(err.message);
    }

    setLoading(false);
  };

  // Colors based on theme
  const bgMain = darkMode ? "bg-gray-900" : "bg-white";
  const bgCard = darkMode ? "bg-gray-900" : "bg-gray-100"; // always bg-gray-900 in dark mode
  const textMain = darkMode ? "text-white" : "text-black";
  const textSecondary = darkMode ? "text-gray-300" : "text-gray-700";
  const inputBg = darkMode ? "bg-gray-700/60" : "bg-gray-200";
  const inputText = darkMode ? "text-white" : "text-black";
  const inputPlaceholder = darkMode ? "placeholder-gray-400" : "placeholder-gray-500";

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 ${bgMain}`}>
      <div
        className={`w-full max-w-md shadow-2xl rounded-3xl p-10 space-y-8 border ${bgCard}`}
        style={{ borderColor: `${primaryColor}/30` }}
      >
        {/* Header */}
        <div className="text-center">
          <img
            className="mx-auto h-20 w-20 rounded-full border-4"
            src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
            alt="Admin Icon"
            style={{ borderColor: primaryColor }}
          />
          <h2 className={`mt-4 text-3xl font-bold tracking-wide ${textMain}`}>Admin Login</h2>
          <p className={`mt-2 text-sm ${textSecondary}`}>Sign in to access your dashboard</p>
          {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className={`block text-sm font-medium ${textSecondary}`}>Email address</label>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              className={`mt-2 block w-full px-5 py-3 border rounded-xl shadow-inner focus:outline-none focus:ring-2 focus:ring-[${primaryColor}] sm:text-sm transition-all duration-200 ${inputBg} ${inputText} ${inputPlaceholder}`}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium ${textSecondary}`}>Password</label>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={`mt-2 block w-full px-5 py-3 border rounded-xl shadow-inner focus:outline-none focus:ring-2 focus:ring-[${primaryColor}] sm:text-sm transition-all duration-200 ${inputBg} ${inputText} ${inputPlaceholder}`}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full flex justify-center py-3 px-6 text-lg font-semibold rounded-2xl shadow-md transition-all duration-300 ${
              loading
                ? "bg-gray-600 cursor-not-allowed"
                : `bg-gradient-to-r from-[${primaryColor}] to-[#02d88f] hover:from-[#02d88f] hover:to-[${primaryColor}] hover:shadow-xl`
            } ${textMain}`}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className={`text-center text-sm ${textSecondary}`}>
          &copy; {new Date().getFullYear()} Faculty of Computing. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Login;
