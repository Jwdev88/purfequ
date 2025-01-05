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
import usePlaceOrder from "../hooks/usePlaceOrder.js";

export const ShopContext = createContext();

const initialState = {
  token: "",
  cartItems: [],
  products: [],
  provinces: [],
  cities: [],
  weight: 1,
  courier: "jne",
  cost: null,
  isLoading: false,
  formData: {
    firstName: "",
    lastName: "",
    email: "",
    alamat: "",
    city: "",
    state: "",
    kodepos: "",
    phone: "",
  },
  selectedService: null,
  method: "cod",
  isLoadingCost: false,
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
    case shopActionTypes.SET_PROVINCES:
      return { ...state, provinces: action.payload };
    case shopActionTypes.SET_PRODUCTS:
      return { ...state, products: action.payload || [] };
    case shopActionTypes.SET_CART_ITEMS:
      return { ...state, cartItems: action.payload };
    case shopActionTypes.SET_CITIES:
      return { ...state, cities: action.payload };
    case shopActionTypes.SET_COST:
      return { ...state, cost: action.payload };
    case shopActionTypes.SET_TOKEN:
      return { ...state, token: action.payload };
    case shopActionTypes.SET_LOADING:
      return { ...state, isLoading: action.payload };
    case shopActionTypes.SET_FORM_DATA:
      return { ...state, formData: { ...state.formData, ...action.payload } };
    case shopActionTypes.SET_SELECTED_SERVICE:
      return { ...state, selectedService: action.payload };
    case shopActionTypes.SET_METHOD:
      return { ...state, method: action.payload };
    case shopActionTypes.SET_LOADING_COST:
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
    fetchData(
      `${backendUrl}/api/product/list`,
      shopActionTypes.SET_PRODUCTS,
      "Gagal mengambil data produk."
    );
  }, [backendUrl, fetchData]);

  useEffect(() => {
    const fetchProvinces = async () => {
      dispatch({ type: shopActionTypes.SET_LOADING, payload: true });
      try {
        const response = await axios.get(
          `${backendUrl}/api/rajaongkir/provinces`
        );
        dispatch({
          type: shopActionTypes.SET_PROVINCES,
          payload: response.data.provinces,
        });
      } catch (error) {
        toast.error("Gagal mengambil data provinsi.");
      } finally {
        dispatch({ type: shopActionTypes.SET_LOADING, payload: false });
      }
    };
    fetchProvinces();
  }, [backendUrl]);

  const fetchCities = useCallback(
    async (provinceId) => {
      dispatch({ type: shopActionTypes.SET_LOADING, payload: true });
      try {
        const response = await axios.get(
          `${backendUrl}/api/rajaongkir/cities/${provinceId}`
        );
        console.log("Cities response data:", response.data.cities); // Check the response here
        dispatch({
          type: shopActionTypes.SET_CITIES,
          payload: response.data.cities,
        });
      } catch (error) {
        toast.error("Gagal mengambil data kota.");
      } finally {
        dispatch({ type: shopActionTypes.SET_LOADING, payload: false });
      }
    },
    [backendUrl]
  );

  useEffect(() => {
    if (state.selectedProvince) {
      fetchCities(state.selectedProvince);
    }
  }, [state.selectedProvince, fetchCities]);
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

  // Use usePlaceOrder hook to get cities and other state
  const {
    state: orderState,
    dispatch: orderDispatch,
    handleProvinceChange,
    handleCityChange,
    calculateShippingCost,
    handleSubmit,
  } = usePlaceOrder(state.cartItems, backendUrl, state.token);

  const value = {
    ...state,
    ...orderState,
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
    calculateShippingCost,
    handleProvinceChange,
    handleCityChange,
    handleSubmit,
  };

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
};

export default ShopContextProvider;
