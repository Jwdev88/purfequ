//ShopContext.jsx

import React, {
  createContext,
  useEffect,
  useReducer,
  useCallback,
} from "react";
import { FormatRupiah } from "@arismun/format-rupiah";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import { actionTypes as shopActionTypes } from "./actionTypes";
import { apiCall } from "../utils/apiCall";
export const ShopContext = createContext();

const initialState = {
  token: localStorage.getItem("token") || "",
  search: "",
  showSearch: false,
  cartItems: [],
  categories: [],
  subCategories: [],
  products: [],
  isLoading: false,
};

const reducer = (state, action) => {
  // console.log("Reducer action type:", action.type);
  // console.log("Reducer action payload:", action.payload);
  switch (action.type) {
    case shopActionTypes.SET_SEARCH:
      return { ...state, search: action.payload };
    case shopActionTypes.TOGGLE_SHOW_SEARCH:
      return { ...state, showSearch: action.payload };
    case shopActionTypes.SET_PRODUCTS:
      return { ...state, products: action.payload || [] };
    case shopActionTypes.SET_CATEGORIES:
      return { ...state, categories: action.payload };
    case shopActionTypes.SET_SUBCATEGORIES:
      return { ...state, subCategories: action.payload || [] };
    case shopActionTypes.SET_CART_ITEMS:
      return { ...state, cartItems: action.payload || [] };
    case shopActionTypes.SET_LOADING:
      return { ...state, isLoading: action.payload };   
    case shopActionTypes.SET_TOKEN:
      return { ...state, token: action.payload };
    default:
      // console.debug("Unhandled action type:", action.type);
      return state;
  }
};



const ShopContextProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const navigate = useNavigate();
  const formatIDR = useCallback(
    (amount) => (
      <FormatRupiah value={amount} decimalSeparator="," thousandSeparator="." />
    ),
    []
  );
  const setToken = useCallback((token) => {
    localStorage.setItem("token", token);
    dispatch({ type: shopActionTypes.SET_TOKEN, payload: token });
  }, []); const setSearch = (search) => {
    dispatch({ type: shopActionTypes.SET_SEARCH, payload: search });
  };
  const toggleShowSearch = (visible) => {
    if (!visible) {
      dispatch({ type: shopActionTypes.SET_SEARCH, payload: "" }); // Reset search saat SearchBar ditutup
    }
    dispatch({ type: shopActionTypes.TOGGLE_SHOW_SEARCH, payload: visible });
  };
  const fetchData = useCallback(
    async (url, actionType, errorMessage) => {
      console.log("Sedang mengambil data dari URL:", url);
      console.log("Tipe Aksi:", actionType);
      dispatch({ type: shopActionTypes.SET_LOADING, payload: true });

      try {
        const response = await apiCall(url, "GET", {}, state.token);
        const data = response.data;
        console.log("Fetched data:", data);

        if (data.success) {
          // Gunakan mapping key yang sesuai dengan response API
          const key = {
            SET_CATEGORIES: "categories",
            SET_SUBCATEGORIES: "subCategories",
            SET_PRODUCTS: "products",
          }[actionType];

          if (key && data[key]) {
            console.log(
              `Dispatching action ${actionType} with payload:`,
              data[key]
            );
            dispatch({
              type: actionType,
              payload: data[key],
            });
          } else {
            console.error(`Key "${key}" tidak ditemukan dalam response API.`);
            toast.error(errorMessage);
          }
        } else {
          throw new Error(data.message || errorMessage);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error(error.message || errorMessage);
      } finally {
        dispatch({ type: shopActionTypes.SET_LOADING, payload: false });
      }
    },
    [state.token]
  );

  useEffect(() => {
    const fetchInitialData = async () => {
      console.log("Fetching initial data...");
      await Promise.all([
        fetchData(
          `${backendUrl}/api/category/list`,
          shopActionTypes.SET_CATEGORIES,
          "Gagal mengambil data kategori."
        ),
        fetchData(
          `${backendUrl}/api/subcategory/list`,
          shopActionTypes.SET_SUBCATEGORIES,
          "Gagal mengambil data subkategori."
        ),
        fetchData(
          `${backendUrl}/api/product/list`,
          shopActionTypes.SET_PRODUCTS,
          "Gagal mengambil data produk."
        ),
      ]);
      console.log("Initial data fetched.");
    };
    fetchInitialData();
  }, [backendUrl, fetchData]);

  const getUserCart = useCallback(async () => {
    try {
      console.log("Fetching user cart...");
      const response = await apiCall(
        `${backendUrl}/api/cart/get`,
        "GET",
        {},
        state.token
      );
      console.log("User cart response:", response.data);
      if (response.data.success) {
        dispatch({
          type: shopActionTypes.SET_CART_ITEMS,
          payload: response.data.cartData || [],
        });
      } else {
        throw new Error("Gagal mengambil data keranjang.");
      }
    } catch (error) {
      console.error("Error fetching user cart:", error);
      toast.error(error.message || "Kesalahan saat mengambil data keranjang.");
    }
  }, [backendUrl, state.token]);

  useEffect(() => {
    if (state.token) getUserCart();
  }, [state.token, getUserCart]);

  const addToCart = useCallback(
    async (productId, variantId, optionId, quantity) => {
      if (!productId || quantity < 1) {
        toast.error("Data tidak valid untuk menambahkan ke keranjang.");
        return;
      }
      try {
        const response = await apiCall(
          `${backendUrl}/api/cart/add`,
          "POST",
          { productId, variantId, optionId, quantity },
          state.token
        );

        console.log("API response:", response.data); // Debugging log

        if (response.data.success) {
          console.log("API cartData:", response.data.cartData); // Debugging log

          dispatch({
            type: shopActionTypes.SET_CART_ITEMS,
            payload: response.data.cartData || [], // Ensure payload is always an array
          });

          toast.success("Produk berhasil ditambahkan ke keranjang.");
          return response.data.cartData;
        } else {
          throw new Error(
            response.data.message || "Gagal menambahkan item ke keranjang."
          );
        }
      } catch (error) {
        toast.error(
          error.message || "Kesalahan saat menambahkan item ke keranjang."
        );
        throw error;
      }
    },
    [backendUrl, state.token]
  );

  const updateQuantity = useCallback(
    async (productId, variantId, optionId, quantity) => {
      if (!productId || quantity < 1) {
        toast.error("Data tidak valid untuk memperbarui kuantitas.");
        return;
      }
      try {
        const response = await apiCall(
          `${backendUrl}/api/cart/update`,
          "POST",
          { productId, variantId, optionId, quantity },
          state.token
        );
        if (response.data.success) {
          const updatedCartItems = response.data.cartItems;
          dispatch({
            type: shopActionTypes.SET_CART_ITEMS,
            payload: updatedCartItems,
          });

          return updatedCartItems;
        } else {
          throw new Error(
            response.data.message || "Gagal memperbarui kuantitas."
          );
        }
      } catch (error) {
        toast.error(
          error.message || "Kesalahan saat memperbarui kuantitas keranjang."
        );
        throw error;
      }
    },
    [backendUrl, state.token]
  );

  const removeItemFromCart = useCallback(
    async (productId, variantId, optionId) => {
      try {
        const response = await apiCall(
          `${backendUrl}/api/cart/update`,
          "POST",
          { productId, variantId, optionId, quantity: 0 },
          state.token
        );
        if (response.data.success) {
          dispatch({
            type: shopActionTypes.SET_CART_ITEMS,
            payload: response.data.cartItems,
          });
        } else {
          throw new Error(
            response.data.message || "Gagal menghapus item dari keranjang."
          );
        }
      } catch (error) {
        toast.error(
          error.message || "Kesalahan saat menghapus item dari keranjang."
        );
      }
    },
    [backendUrl, state.token]
  );

  const clearCart = useCallback(async () => {
    try {
      const response = await apiCall(
        `${backendUrl}/api/cart/clear`,
        "POST",
        {},
        state.token
      );
      if (response.data.success) {
        dispatch({ type: shopActionTypes.SET_CART_ITEMS, payload: [] });
      } else {
        throw new Error("Gagal mengosongkan keranjang.");
      }
    } catch (error) {
      toast.error(error.message || "Gagal mengosongkan keranjang.");
    }
  }, [backendUrl, state.token]);

  const getCountCart = useCallback(() => {
    return state.cartItems.reduce((count, item) => count + item.quantity, 0);
  }, [state.cartItems]);

  const getCartAmount = useCallback(() => {
    const totalAmount = state.cartItems.reduce((amount, item) => {
      const itemPrice = parseFloat(
        item.variant?.selectedOption?.optionPrice ?? item.productPrice ?? 0
      );
      const itemQuantity = parseInt(item.quantity, 10) || 0;
      return amount + itemQuantity * itemPrice;
    }, 0);
    return totalAmount;
  }, [state.cartItems]);
  const value = {
    ...state,
    formatIDR,
    setSearch,
    toggleShowSearch,
    setToken,
    addToCart,
    getUserCart,
    updateQuantity,
    removeItemFromCart,
    clearCart,
    getCountCart,
    getCartAmount,
    navigate,
    backendUrl,
    dispatch,
  };
  console.log("Shop Context State:", state);

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
};

export default ShopContextProvider;
