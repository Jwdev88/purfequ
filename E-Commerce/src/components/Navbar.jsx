import React, { useContext, useReducer, useCallback } from 'react';
import { assets } from '../assets/assets';
import { NavLink, Link } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import { actionTypes } from "../context/actionTypes";

const initialState = { visible: false };

const reducer = (state, action) => {
  switch (action.type) {
    case 'TOGGLE_VISIBILITY':
      return { ...state, visible: !state.visible };
    default:
      return state;
  }
};

const Navbar = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { toggleShowSearch, navigate, token, setToken, getCountCart,dispatch: globalDispatch } = useContext(ShopContext);

  const logout = useCallback(() => {
    globalDispatch({ type: actionTypes.CLEAR_CART }); // Pastikan CLEAR_CART ada

    navigate('/login');
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    setToken('');
  }, [navigate, setToken, globalDispatch]);

  return (
    <div className="flex items-center justify-between py-5 font-medium">
      <Link to="/">
        <img src={assets.logo2} className="w-36" alt="Logo" />
      </Link>

      <ul className="hidden sm:flex gap-5 text-sm text-gray-700">
        <NavLink to="/" className="flex flex-col items-center gap-1">
          <p>Home</p>
          <hr className="w-2/4 border-none h-[1.5px] bg-gray-700 hidden" />
        </NavLink>
        <NavLink to="/collection" className="flex flex-col items-center gap-1">
          <p>Collection</p>
          <hr className="w-2/4 border-none h-[1.5px] bg-gray-700 hidden" />
        </NavLink>
        <NavLink to="/about" className="flex flex-col items-center gap-1">
          <p>About</p>
          <hr className="w-2/4 border-none h-[1.5px] bg-gray-700 hidden" />
        </NavLink>
        <NavLink to="/contact" className="flex flex-col items-center gap-1">
          <p>Contact</p>
          <hr className="w-2/4 border-none h-[1.5px] bg-gray-700 hidden" />
        </NavLink>
      </ul>

      <div className="flex items-center gap-6">
        <img onClick={() => toggleShowSearch(true)} src={assets.search_icon} className="w-5 cursor-pointer" alt="Search" />

        <div className="group relative">
          <img onClick={() => token ? null : navigate('/login')} className="w-5 cursor-pointer" src={assets.profile_icon} alt="Profile" />
          {token &&
            <div className="group-hover:block hidden absolute dropdown-menu right-0 pt-4">
              <div className="flex flex-col gap-2 w-36 py-3 px-5 bg-slate-100 text-gray-500 rounded">
                <p className="cursor-pointer hover:text-black">My Profile</p>
                <p onClick={() => navigate('/orders')} className="cursor-pointer hover:text-black">Orders</p>
                <p onClick={logout} className="cursor-pointer hover:text-black">Logout</p>
              </div>
            </div>}
        </div>

        <Link to="/cart" className="relative">
          <img src={assets.cart_icon} className="w-5 min-w-5" alt="Cart" />
          <p className="absolute right-[-5px] bottom-[-5px] w-4 text-center leading-4 bg-black text-white aspect-square rounded-full text-[8px]">
            {getCountCart()}
          </p>
        </Link>
      </div>

      {/* Sidebar menu for small screens */}
      <div className={`absolute top-0 right-0 bottom-0 overflow-hidden bg-white transition-all ${state.visible ? 'w-full' : 'w-0'}`}>
        <div className="flex flex-col text-gray-600">
          <div onClick={() => dispatch({ type: 'TOGGLE_VISIBILITY' })} className="flex items-center gap-4 p-3 cursor-pointer">
            <img src={assets.dropdown_icon} className="h-4 rotate-180" alt="Back" />
            <p>Back</p>
          </div>
          <NavLink onClick={() => dispatch({ type: 'TOGGLE_VISIBILITY' })} className="py-2 pl-6 border" to="/">
            Home
          </NavLink>
          <NavLink onClick={() => dispatch({ type: 'TOGGLE_VISIBILITY' })} className="py-2 pl-6 border" to="/collection">
            Collection
          </NavLink>
          <NavLink onClick={() => dispatch({ type: 'TOGGLE_VISIBILITY' })} className="py-2 pl-6 border" to="/about">
            About
          </NavLink>
          <NavLink onClick={() => dispatch({ type: 'TOGGLE_VISIBILITY' })} className="py-2 pl-6 border" to="/contact">
            Contact
          </NavLink>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
