import React, { useState } from "react";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

const Login = ({ setToken, setAdminEmail }) => {  // Added setAdminEmail
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

      // Only allow admin email
      const ADMIN_EMAIL = "smarfingeriot32@gmail.com"; // Use a constant for consistency
      if (user.email !== ADMIN_EMAIL) {
        setError("You are not authorized as admin.");
        await auth.signOut();
        setLoading(false);
        return;
      }

      // Store token and email
      setToken(user.uid);
      setAdminEmail(user.email);
    } catch (err) {
      console.error(err);
      setError(err.message);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 to-white px-4">
      <div className="w-full max-w-md bg-white shadow-xl rounded-2xl p-8 space-y-6">
        <div className="text-center">
          <img
            className="mx-auto h-16 w-16 rounded-full border-2 border-green-500"
            src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
            alt="Admin Icon"
          />
          <h2 className="mt-4 text-2xl font-bold text-gray-800">Admin Login</h2>
          <p className="text-sm text-gray-500">Sign in to access your dashboard</p>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email-address" className="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <input
              id="email-address"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-green-500 focus:border-indigo-500 sm:text-sm"
              placeholder="admin@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="••••••••"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white transition-all duration-200 ${
                loading
                  ? "bg-indigo-300 cursor-not-allowed"
                  : "bg-[#02c986] hover:bg-[#029c72] focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              }`}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
