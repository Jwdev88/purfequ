import React, { useReducer, useContext, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import { apiCall } from "../utils/apiCall"; // Import apiCall
import { toast } from "react-toastify";
import { Loader2 } from "lucide-react";

// ... (rest of your initialState, reducer, and InputField) ...
const initialState = {
    currentState: "Login",
    name: "",
    email: "",
    password: "",
  };
  
  const reducer = (state, action) => {
    switch (action.type) {
      case "SET_CURRENT_STATE":
        return { ...state, currentState: action.payload };
      case "SET_NAME":
        return { ...state, name: action.payload };
      case "SET_EMAIL":
        return { ...state, email: action.payload };
      case "SET_PASSWORD":
        return { ...state, password: action.payload };
      default:
        return state;
    }
  };
  
  const InputField = ({ label, type, value, onChange }) => (
    <div className="mt-4">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        required
      />
    </div>
  );

const Login = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { setToken, dispatch: globalDispatch, backendUrl, navigate } = useContext(ShopContext);
  const [loading, setLoading] = useState(false);

//   const handleApiError = (error) => { // No longer needed, apiCall handles it
//     console.error(error);
//     toast.error("Terjadi kesalahan, silakan coba lagi.");
//   };

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const { email, password, name, currentState } = state;
      let url, method, data;

      if (currentState === "Sign Up") {
        url = backendUrl + "/api/user/register";
        method = "POST";
        data = { name, email, password };
      } else {
        url = backendUrl + "/api/user/login";
        method = "POST";
        data = { email, password };
      }

      // Call apiCall - DO NOT pass a token for login/register
      const response = await apiCall(url, method, data); // No token!

      if (response.ok) { // Use response.ok
        globalDispatch({ type: "SET_TOKEN", payload: response.data.token });
        setToken(response.data.token);
        localStorage.setItem("token", response.data.token);

        if (currentState === "Sign Up") {
          navigate("/");
          toast.success("Akun berhasil dibuat! 🎉");
        } else {
          navigate("/");
          toast.success("Login berhasil! Welcome 👋");
        }
      } else {
          // apiCall now throws, so this 'else' is no longer needed
          // toast.error(response.data.message); // apiCall throws, so this is redundant
      }
    } catch (error) {
        // Handle the error thrown by apiCall
        toast.error(error.message); // Display the error message
    } finally {
      setLoading(false);
    }
  };

  return (
    // ... (rest of your JSX) ...
    <div className="flex justify-center items-center h-screen bg-white-50 px-4">
    <form
      onSubmit={onSubmitHandler}
      className="bg-white shadow-lg rounded-lg p-6 w-full max-w-md"
    >
      <h2 className="text-center text-2xl font-semibold mb-4">{state.currentState}</h2>

      {state.currentState === "Sign Up" && (
        <InputField
          label="Nama Lengkap"
          type="text"
          value={state.name}
          onChange={(e) => dispatch({ type: "SET_NAME", payload: e.target.value })}
        />
      )}

      <InputField
        label="Email"
        type="email"
        value={state.email}
        onChange={(e) => dispatch({ type: "SET_EMAIL", payload: e.target.value })}
      />

      <InputField
        label="Password"
        type="password"
        value={state.password}
        onChange={(e) => dispatch({ type: "SET_PASSWORD", payload: e.target.value })}
      />

      <div className="mt-4 flex justify-between text-sm">
        <button
          type="button"
          onClick={() =>
            dispatch({
              type: "SET_CURRENT_STATE",
              payload: state.currentState === "Login" ? "Sign Up" : "Login",
            })
          }
          className="text-blue-600 hover:underline"
        >
          {state.currentState === "Login" ? "Buat akun baru" : "Sudah punya akun? Login"}
        </button>
      </div>

      <button
        className={`w-full mt-6 py-2 text-white rounded-lg ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
        disabled={loading}
      >
        {loading ? (
          <span className="flex justify-center items-center gap-2">
            <Loader2 className="animate-spin w-5 h-5" />
            Sedang memproses...
          </span>
        ) : state.currentState === "Login" ? "Login" : "Sign Up"}
      </button>
    </form>
  </div>
  );
};

export default Login;