import React, { useState } from 'react'
import axios from 'axios'
import { backendURI } from '../App'
import { toast } from 'react-toastify'


const Login = ({setToken}) => {
  const [email, setEmail] = useState ('')
  const [password,setPassword] = useState ('')
  const onSumbitHandler = async (e) => {
    try {
      e.preventDefault();
      const response = await axios.post(backendURI + '/api/user/admin', { email, password }); // Corrected URL
  
      if (response.data.success) {
        setToken(response.data.token);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center w-full">
      <div className="bg-white shadow-md rounded-lg px-8 py-6 max-w-md">
        <h1 className="text-2xl font-bold mb-4">Admin Panel</h1>
        <form onSubmit={onSubmitHandler}>
          {/* ... (your email input code) ... */}

          <div className="mb-3 min-w-72 relative"> {/* Add relative for positioning */}
            <label htmlFor="password" className="text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type={showPassword ? 'text' : 'password'} 
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-md w-full px-3 py-2 border border-gray-300 outline-none"
            />
            <button
              type="button" // Prevent form submission
              onClick={togglePasswordVisibility}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              {showPassword ? (
                <svg // Eye off icon (replace with your icon)
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor" 
                  className="h-5 w-5"
                >
                  {/* ... your eye off icon SVG path ... */}
                </svg>
              ) : (
                <svg // Eye icon (replace with your icon)
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor" 
                  className="h-5 w-5"
                >
                  {/* ... your eye icon SVG path ... */}
                </svg>
              )}
            </button>
          </div>

          {/* ... (your submit button code) ... */}
        </form>
      </div>
    </div>
  );

 )
}

export default Login
