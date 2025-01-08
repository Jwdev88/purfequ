import React, { useReducer, useContext, useEffect } from 'react';
import { ShopContext } from '../context/ShopContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const initialState = {
  currentState: 'Login',
  name: '',
  email: '',
  password: '',
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'SET_CURRENT_STATE':
      return { ...state, currentState: action.payload };
    case 'SET_NAME':
      return { ...state, name: action.payload };
    case 'SET_EMAIL':
      return { ...state, email: action.payload };
    case 'SET_PASSWORD':
      return { ...state, password: action.payload };
    default:
      return state;
  }
};

const Login = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { token, setToken, dispatch: globalDispatch, backendUrl, navigate } = useContext(ShopContext);

  // Cek token dari context saat komponen dimuat
  useEffect(() => {
    // console.log('Token di context:', token);
  }, [token]);  // Menyimak token jika berubah

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    try {
      if (state.currentState === 'Sign Up') {
        const response = await axios.post(backendUrl + '/api/user/register', {
          name: state.name,
          email: state.email,
          password: state.password,
        });
        if (response.data.success) {
          // Set token ke context dan localStorage
          globalDispatch({ type: 'SET_TOKEN', payload: response.data.token });
          setToken(response.data.token); // Simpan token di localStorage
          navigate('/'); // Redirect setelah registrasi sukses
        } else {
          toast.error(response.data.message);
        }
      } else {
        const response = await axios.post(backendUrl + '/api/user/login', {
          email: state.email,
          password: state.password,
        });
        if (response.data.success) {
          // Set token ke context dan localStorage
          globalDispatch({ type: 'SET_TOKEN', payload: response.data.token });
          setToken(response.data.token);  // Simpan token di localStorage
          localStorage.setItem('token', response.data.token);
          console.log('Token yang diterima:', response.data.token);
          navigate('/');  // Redirect setelah login sukses
        } else {
          toast.error(response.data.message);
        }
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    }
  };

  return (
    <form onSubmit={onSubmitHandler} className="flex flex-col items-center w-[90%] sm:max-w-96 m-auto mt-14 gap-4 text-gray-800">
      <div className="inline-flex items-center gap-2 mb-2 mt-10">
        <p className="prate-regular text-3xl">{state.currentState}</p>
        <hr className="border-none h-[1.5px] w-8 bg-gray-800" />
      </div>
      {state.currentState === 'Login' ? (
        ''
      ) : (
        <input
          onChange={(e) => dispatch({ type: 'SET_NAME', payload: e.target.value })}
          value={state.name}
          className="w-full px-3 py-2 border border-gray-800"
          placeholder="name"
          type="text"
          required
        />
      )}
      <input
        onChange={(e) => dispatch({ type: 'SET_EMAIL', payload: e.target.value })}
        value={state.email}
        className="w-full px-3 py-2 border border-gray-800"
        placeholder="email"
        type="email"
        required
      />
      <input
        onChange={(e) => dispatch({ type: 'SET_PASSWORD', payload: e.target.value })}
        value={state.password}
        className="w-full px-3 py-2 border border-gray-800"
        placeholder="password"
        type="password"
        required
      />
      <div className="w-full flex justify-between text-sm mt-[-8x]">
        <p className="cursor-pointer">Forget your password?</p>
        {state.currentState === 'Login' ? (
          <p onClick={() => dispatch({ type: 'SET_CURRENT_STATE', payload: 'Sign Up' })} className="cursor-pointer">
            Create account
          </p>
        ) : (
          <p onClick={() => dispatch({ type: 'SET_CURRENT_STATE', payload: 'Login' })} className="cursor-pointer">
            Login Here
          </p>
        )}
      </div>
      <button className="bg-black text-white font-light px-8 py-2 mt-4">
        {state.currentState === 'Login' ? 'Sign in' : 'Sign Up'}
      </button>
    </form>
  );
};

export default Login;
