import React, { useContext, useReducer, useCallback, useRef, useEffect } from 'react';
import { assets } from '../assets/assets'; // Make sure the path is correct
import { NavLink, Link, useLocation } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import { actionTypes } from "../context/actionTypes";
import { Menu, X, Search, User, ShoppingCart } from 'lucide-react';

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
    const { toggleShowSearch, navigate, token, setToken, getCountCart, dispatch: globalDispatch, setSearch } = useContext(ShopContext);
    const location = useLocation();
    const sidebarRef = useRef(null);

    const logout = useCallback(() => {
        globalDispatch({ type: actionTypes.CLEAR_CART });
        navigate('/login');
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        setToken('');
    }, [navigate, setToken, globalDispatch]);

    const toggleSidebar = () => {
        dispatch({ type: 'TOGGLE_VISIBILITY' });
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (sidebarRef.current && !sidebarRef.current.contains(event.target) && state.visible) {
                dispatch({ type: 'TOGGLE_VISIBILITY' });
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [state.visible]);

    return (
        <nav className="bg-white shadow-sm sticky top-0 z-50">
            <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                <Link to="/">
                    <img src={assets.logo2} className="h-8 md:h-10" alt="Logo" />
                </Link>

                <ul className="hidden md:flex gap-8 text-gray-700">
                    <NavLink to="/" className={({ isActive }) => `flex items-center gap-1 ${isActive ? 'text-black font-semibold' : 'hover:text-gray-900'} transition-colors`}>
                        <span>Home</span>
                    </NavLink>
                    <NavLink to="/collection" className={({ isActive }) => `flex items-center gap-1 ${isActive ? 'text-black font-semibold' : 'hover:text-gray-900'} transition-colors`}>
                        <span>Collection</span>
                    </NavLink>
                    <NavLink to="/about" className={({ isActive }) => `flex items-center gap-1 ${isActive ? 'text-black font-semibold' : 'hover:text-gray-900'} transition-colors`}>
                        <span>About</span>
                    </NavLink>
                    <NavLink to="/contact" className={({ isActive }) => `flex items-center gap-1 ${isActive ? 'text-black font-semibold' : 'hover:text-gray-900'} transition-colors`}>
                        <span>Contact</span>
                    </NavLink>
                </ul>

                <div className="flex items-center gap-4">
                    {/* Search Icon (Opens Search Bar - Handled in ShopContext) */}
                    <button
                        onClick={() => toggleShowSearch(true)}
                        aria-label="Search"
                        className="hover:text-gray-900 transition-colors"
                    >
                        <Search className="w-5 h-5" />
                    </button>

                    <div className="relative group">
                        <button 
                            onClick={() => token ? null : navigate('/login')} 
                            aria-label="Profile" 
                            className="hover:text-gray-900 transition-colors"
                        >
                            <User className="w-5 h-5" />
                        </button>
                        {token && (
                            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg py-2 z-10 opacity-0 group-hover:opacity-100 group-hover:visible transition-opacity duration-300 ease-in-out">
                                <Link 
                                    to="/profile" 
                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                    My Profile
                                </Link>
                                <Link 
                                    to="/orders" 
                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                    Orders
                                </Link>
                                <button 
                                    onClick={logout} 
                                    className="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left"
                                >
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>

                    <Link to="/cart" className="relative hover:text-gray-900 transition-colors" aria-label="Cart">
                        <ShoppingCart className="w-5 h-5" />
                        <span className="absolute right-[-8px] top-[-8px] w-4 h-4 bg-blue-600 text-white rounded-full text-[10px] flex items-center justify-center">
                            {getCountCart()}
                        </span>
                    </Link>

                    {/* Hamburger Menu Button */}
                    <button onClick={toggleSidebar} className="md:hidden" aria-label="Open Menu">
                        <Menu className="h-6 w-6 text-gray-700" />
                    </button>
                </div>

                {/* Sidebar Menu */}
                <div
                    ref={sidebarRef}
                    className={`fixed top-0 right-0 bottom-0 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${state.visible ? 'translate-x-0' : 'translate-x-full'} md:hidden z-40`}
                >
                    <div className="flex items-center justify-between p-4 border-b">
                        <span className="text-lg font-semibold">Menu</span>
                        <button onClick={toggleSidebar} aria-label="Close Menu">
                            <X className="h-6 w-6 text-gray-700" />
                        </button>
                    </div>
                    <div className="flex flex-col text-gray-600">
                        <NavLink onClick={toggleSidebar} className="py-3 pl-6 border-b hover:bg-gray-50" to="/">Home</NavLink>
                        <NavLink onClick={toggleSidebar} className="py-3 pl-6 border-b hover:bg-gray-50" to="/collection">Collection</NavLink>
                        <NavLink onClick={toggleSidebar} className="py-3 pl-6 border-b hover:bg-gray-50" to="/about">About</NavLink>
                        <NavLink onClick={toggleSidebar} className="py-3 pl-6 border-b hover:bg-gray-50" to="/contact">Contact</NavLink>
                    </div>
                </div>
                {/* Overlay to close sidebar */}
                {state.visible && (
                    <div
                        className="fixed inset-0 bg-black opacity-50 z-30 md:hidden"
                        onClick={toggleSidebar}
                        aria-label="Close Menu"
                    ></div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
