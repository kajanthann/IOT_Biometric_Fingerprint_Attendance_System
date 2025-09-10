import React, { useState } from "react";

const Login = () => {
  const [state, setState] = useState("sign up");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const onsubmitHandler = async (event) => {
    event.preventDefalut();
  };

  return (
    <form className="min-h-[90vh] flex items-center justify-center">
      <div className="flex flex-col gap-4 p-6 w-full max-w-sm sm:max-w-md border rounded-xl shadow-lg bg-white">
        <h2 className="text-2xl font-semibold text-gray-700">
          {state === "sign up" ? "Create Account" : "Log In"}
        </h2>
        <p className="text-gray-500">
          Please {state === "sign up" ? "Sign Up" : "Log In"} to book an
          appointment
        </p>
        {state === "sign up" && (
          <div className="w-full">
            <label className="block text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
              onChange={(e) => setName(e.target.value)}
              value={name}
              required
            />
          </div>
        )}

        <div className="w-full">
          <label className="block text-gray-700 mb-1">Email</label>
          <input
            type="email"
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            required
          />
        </div>

        <div className="w-full">
          <label className="block text-gray-700 mb-1">Password</label>
          <input
            type="password"
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
            onChange={(e) => setPassword(e.target.value)}
            value={password}
            required
          />
        </div>

        <button className="w-full py-2 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600 transition-all">
          {state === "sign up" ? "Create Account" : "Log In"}
        </button>

        {state === "sign up" ? (
          <p>
            You already have an account?{" "}
            <span
              onClick={() => setState("Login")}
              className="text-blue-500 cursor-pointer"
            >
              login here
            </span>{" "}
          </p>
        ) : (
          <p>
            Create an new account?{" "}
            <span
              onClick={() => setState("sign up")}
              className="text-blue-500 cursor-pointer"
            >
              {" "}
              click here
            </span>
          </p>
        )}
      </div>
    </form>
  );
};

export default Login;
