import React, { useReducer, useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import axios from "axios";
import { notifySuccess, notifyError } from "../components/ToastNotification";
import { Loader2 } from "lucide-react";

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

const Login = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { setToken, dispatch: globalDispatch, backendUrl, navigate } =
    useContext(ShopContext);
  const [loading, setLoading] = useState(false);

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      if (state.currentState === "Sign Up") {
        const response = await axios.post(backendUrl + "/api/user/register", {
          name: state.name,
          email: state.email,
          password: state.password,
        });

        if (response.data.success) {
          globalDispatch({ type: "SET_TOKEN", payload: response.data.token });
          setToken(response.data.token);
          navigate("/");
          notifySuccess("Akun berhasil dibuat! 🎉");
        } else {
          notifyError(response.data.message);
        }
      } else {
        const response = await axios.post(backendUrl + "/api/user/login", {
          email: state.email,
          password: state.password,
        });

        if (response.data.success) {
          globalDispatch({ type: "SET_TOKEN", payload: response.data.token });
          setToken(response.data.token);
          localStorage.setItem("token", response.data.token);
          notifySuccess("Login berhasil! Selamat datang 👋");
          navigate("/");
        } else {
          notifyError("Email atau password salah ❌");
        }
      }
    } catch (error) {
      notifyError("Terjadi kesalahan, coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-white-50 px-4">
      <form
        onSubmit={onSubmitHandler}
        className="bg-white shadow-lg rounded-lg p-6 w-full max-w-md"
      >
        <h2 className="text-center text-2xl font-semibold mb-4">
          {state.currentState}
        </h2>

        {state.currentState === "Sign Up" && (
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nama Lengkap
            </label>
            <input
              onChange={(e) =>
                dispatch({ type: "SET_NAME", payload: e.target.value })
              }
              value={state.name}
              className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Nama Anda"
              type="text"
              required
            />
          </div>
        )}

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            onChange={(e) =>
              dispatch({ type: "SET_EMAIL", payload: e.target.value })
            }
            value={state.email}
            className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Email"
            type="email"
            required
          />
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            onChange={(e) =>
              dispatch({ type: "SET_PASSWORD", payload: e.target.value })
            }
            value={state.password}
            className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Password"
            type="password"
            required
          />
        </div>

        <div className="mt-4 flex justify-between text-sm">
          {/* <button
            type="button"
            className="text-blue-600 hover:underline"
          >
            Lupa password?
          </button> */}
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
            {state.currentState === "Login"
              ? "Buat akun baru"
              : "Sudah punya akun? Login"}
          </button>
        </div>

        <button
          className={`w-full mt-6 py-2 text-white rounded-lg ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
          disabled={loading}
        >
          {loading ? (
            <span className="flex justify-center items-center gap-2">
              <Loader2 className="animate-spin w-5 h-5" />
              Memproses...
            </span>
          ) : state.currentState === "Login" ? (
            "Masuk"
          ) : (
            "Daftar"
          )}
        </button>
      </form>
    </div>
  );
};

export default Login;
