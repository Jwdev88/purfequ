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
          <div className="mb-3 min-w-72">
            <label htmlFor="email" className="text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-md w-full px-3 py-2 border border-gray-300 outline-none"
            />
          </div>
          <div className="mb-3 min-w-72">
            <label htmlFor="password" className="text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-md w-full px-3 py-2 border border-gray-300 outline-none"
            />
          </div>
          <button type="submit" className="mt-2 w-full py-2 px-4 rounded-md text-white bg-black">
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login
