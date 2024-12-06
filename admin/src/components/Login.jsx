import React, { useState } from "react";
import axios from "axios";
import { backendURI } from "../App";
import { toast } from "react-toastify";

const Login = ({ setToken }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      try {
        const response = await axios.post(backendURI + "/api/user/admin", {
          email,
          password,
        });

        if (response.data.success) {
          setToken(response.data.token);
        } else {
          toast.error(response.data.message);
        }
      } catch (error) {
        console.error(error);
        toast.error(error.message);
      }
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!email) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = "Invalid email address";
    }

    if (!password) {
      errors.password = "Password is required";
    } else if (password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }

    return errors;
  };

  return (
    <div className="min-h-screen flex items-center justify-center w-full">
      <div className="bg-white shadow-md rounded-lg px-8 py-6 max-w-md">
        <h1 className="text-2xl font-bold mb-4">Admin Panel</h1>
        <form onSubmit={onSubmitHandler}>
          <div className="mb-3">
            <label htmlFor="email" className="text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`rounded-md w-full px-3 py-2 border border-gray-300 outline-none ${
                errors.email ? "border-red-500" : ""
              }`}
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}
          </div>
<div className="mb-3 relative"> 
  <label htmlFor="password" className="text-sm font-medium text-gray-700 mb-2">
    Password
  </label>
  <input
    type={showPassword ? "text" : "password"}
    id="password"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    className={`rounded-md w-full px-3 py-2 border border-gray-300 outline-none ${
      errors.password ? "border-red-500" : ""
    }`}
  />
  {errors.password && (
    <p className="text-red-500 text-xs mt-1">{errors.password}</p>
  )}

  <button
    type="button"
    onClick={togglePasswordVisibility}
    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500" 
  >
    {showPassword ? "Hide" : "Show"}
  </button>
</div>

          <button
            type="submit"
            className="mt-2 w-full py-2 px-4 rounded-md text-white bg-black"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
