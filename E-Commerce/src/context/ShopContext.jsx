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
import axios from "axios";
import { actionTypes as shopActionTypes } from "./actionTypes";

export const ShopContext = createContext();

const initialState = {
  token: localStorage.getItem("token") || "",
  cartItems: [],
  categories: [],
  subCategories: [],
  products: [],
  isLoading: false,
};

const reducer = (state, action) => {
  switch (action.type) {
    case shopActionTypes.SET_CART_DATA:
      return { ...state, cartItems: action.payload };
    case shopActionTypes.UPDATE_QUANTITY:
      return {
        ...state,
        cartItems: state.cartItems.map((item) =>
          item.productId === action.payload.productId &&
          item.variantId === action.payload.variantId &&
          item.optionId === action.payload.optionId
            ? {
                ...item,
                quantity: action.payload.newQuantity,
                totalPrice: item.optionPrice * action.payload.newQuantity,
              }
            : item
        ),
      };
    case shopActionTypes.CLEAR_CART:
      return { ...state, cartItems: [] };
    case shopActionTypes.SET_PRODUCTS:
      return { ...state, products: action.payload || [] };
    case shopActionTypes.SET_CATEGORIES:
      return { ...state, categories: action.payload }; // Added case for setting categories
    case shopActionTypes.SET_SUBCATEGORIES:
      return { ...state, subCategories: action.payload };
    case shopActionTypes.SET_CART_ITEMS:
      return { ...state, cartItems: action.payload };

      return { ...state, cost: action.payload };
    case shopActionTypes.SET_TOKEN:
      return { ...state, token: action.payload };
    case shopActionTypes.SET_LOADING:
      return { ...state, isLoading: action.payload };

      return { ...state, isLoadingCost: action.payload };
    default:
      return state;
  }
};

export const apiCall = async (url, method = "GET", data = {}, token = "") => {
  const config = {
    method,
    url,
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : undefined,
    },
    data,
  };
  return axios(config);
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
    dispatch({ type: shopActionTypes.SET_TOKEN, payload: token });
  }, []);

  const fetchData = useCallback(async (url, actionType, errorMessage) => {
    dispatch({ type: shopActionTypes.SET_LOADING, payload: true });
    try {
      const response = await apiCall(url);
      if (response.data.success) {
        const key = actionType.split("_")[1].toLowerCase();
        dispatch({
          type: shopActionTypes[actionType],
          payload: response.data[key],
        });
      } else {
        toast.error(response.data.message || errorMessage);
      }
    } catch (error) {
      toast.error(error.message || errorMessage);
    } finally {
      dispatch({ type: shopActionTypes.SET_LOADING, payload: false });
    }
  }, []);

  useEffect(() => {
    const fetchInitialData = async () => {
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
    };
    fetchInitialData();
  }, [backendUrl, fetchData]);

  const getUserCart = useCallback(async () => {
    try {
      const response = await apiCall(
        `${backendUrl}/api/cart/get`,
        "GET",
        {},
        state.token
      );
      if (response.data.success) {
        dispatch({
          type: shopActionTypes.SET_CART_ITEMS,
          payload: response.data.cartData || [],
        });
      } else {
        throw new Error("Gagal mengambil data keranjang.");
      }
    } catch (error) {
      toast.error(error.message || "Kesalahan saat mengambil data keranjang.");
    }
  }, [backendUrl, state.token]);

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
        if (response.data.success) {
          await getUserCart();
        } else {
          throw new Error(
            response.data.message || "Gagal menambahkan item ke keranjang."
          );
        }
      } catch (error) {
        toast.error(
          error.message || "Kesalahan saat menambahkan item ke keranjang."
        );
      }
    },
    [backendUrl, state.token, getUserCart]
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

  useEffect(() => {
    if (state.token) getUserCart();
  }, [state.token, getUserCart]);

  const value = {
    ...state,
    formatIDR,
    setToken,
    addToCart,
    updateQuantity,
    removeItemFromCart,
    clearCart,
    getUserCart,
    navigate,
    backendUrl,
    dispatch,
    getCountCart,
    getCartAmount,
  };

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
};

export default ShopContextProvider;
