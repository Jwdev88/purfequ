// Optimized Shipping, Cart, Product, and Payment Management without Redux

import { useReducer, useCallback, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";

// Initial State
const initialState = {
  provinces: [],
  cities: [],
  citiesCache: {},
  cost: null,
  products: [],
  cart: [],
  isLoading: false,
  error: null,
  token: "", // Assumes token is set elsewhere
};

// Action Types
const actionTypes = {
  SET_PROVINCES: "SET_PROVINCES",
  SET_CITIES: "SET_CITIES",
  SET_COST: "SET_COST",
  SET_PRODUCTS: "SET_PRODUCTS",
  SET_CART: "SET_CART",
  SET_LOADING: "SET_LOADING",
  SET_ERROR: "SET_ERROR",
};

// Reducer
const reducer = (state, action) => {
  switch (action.type) {
    case actionTypes.SET_PROVINCES:
      return { ...state, provinces: action.payload };
    case actionTypes.SET_CITIES:
      return { ...state, cities: action.payload }; // For current cities
    case actionTypes.SET_COST:
      return { ...state, cost: action.payload };
    case actionTypes.SET_PRODUCTS:
      return { ...state, products: action.payload };
    case actionTypes.SET_CART:
      return { ...state, cart: action.payload };
    case actionTypes.SET_LOADING:
      return { ...state, isLoading: action.payload };
    case actionTypes.SET_ERROR:
      return { ...state, error: action.payload };
    default:
      return state;
  }
};

// Hook for Managing State and API Calls
const useEcommerce = (backendUrl, token) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Fetch Provinces
  const fetchProvinces = useCallback(async () => {
    try {
      const cachedProvinces = sessionStorage.getItem("provinces");
      if (cachedProvinces) {
        dispatch({ type: actionTypes.SET_PROVINCES, payload: JSON.parse(cachedProvinces) });
        return;
      }

      dispatch({ type: actionTypes.SET_LOADING, payload: true });
      const response = await axios.get(`${backendUrl}/api/rajaongkir/provinces`);
      sessionStorage.setItem("provinces", JSON.stringify(response.data.provinces));
      dispatch({ type: actionTypes.SET_PROVINCES, payload: response.data.provinces });
    } catch (error) {
      toast.error("Failed to fetch provinces.");
      dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
    } finally {
      dispatch({ type: actionTypes.SET_LOADING, payload: false });
    }
  }, [backendUrl]);

  // Fetch Cities
  const fetchCities = useCallback(async (provinceId) => {
    try {
      const { citiesCache } = state;
      if (citiesCache[provinceId]) {
        dispatch({ type: actionTypes.SET_CITIES, payload: citiesCache[provinceId] });
        return;
      }

      dispatch({ type: actionTypes.SET_LOADING, payload: true });
      const response = await axios.get(`${backendUrl}/api/rajaongkir/cities/${provinceId}`);
      dispatch({
        type: actionTypes.SET_CITIES,
        payload: response.data.cities,
      });
      state.citiesCache[provinceId] = response.data.cities;
    } catch (error) {
      toast.error("Failed to fetch cities.");
      dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
    } finally {
      dispatch({ type: actionTypes.SET_LOADING, payload: false });
    }
  }, [backendUrl, state]);

  // Calculate Shipping Cost
  const calculateShippingCost = useCallback(async (data) => {
    try {
      dispatch({ type: actionTypes.SET_LOADING, payload: true });
      const response = await axios.post(`${backendUrl}/api/rajaongkir/cost`, data);
      dispatch({ type: actionTypes.SET_COST, payload: response.data.costs });
    } catch (error) {
      toast.error("Failed to calculate shipping cost.");
      dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
    } finally {
      dispatch({ type: actionTypes.SET_LOADING, payload: false });
    }
  }, [backendUrl]);

  // Fetch Products
  const fetchProducts = useCallback(async () => {
    try {
      dispatch({ type: actionTypes.SET_LOADING, payload: true });
      const response = await axios.get(`${backendUrl}/api/product/list`);
      dispatch({ type: actionTypes.SET_PRODUCTS, payload: response.data.products });
    } catch (error) {
      toast.error("Failed to fetch products.");
      dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
    } finally {
      dispatch({ type: actionTypes.SET_LOADING, payload: false });
    }
  }, [backendUrl]);

  // Fetch Cart
  const fetchCart = useCallback(async () => {
    try {
      dispatch({ type: actionTypes.SET_LOADING, payload: true });
      const response = await axios.get(`${backendUrl}/api/cart/get`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      dispatch({ type: actionTypes.SET_CART, payload: response.data.cartData });
    } catch (error) {
      toast.error("Failed to fetch cart.");
      dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
    } finally {
      dispatch({ type: actionTypes.SET_LOADING, payload: false });
    }
  }, [backendUrl, token]);

  // Add to Cart
  const addToCart = useCallback(async (item) => {
    try {
      dispatch({ type: actionTypes.SET_LOADING, payload: true });
      const response = await axios.post(`${backendUrl}/api/cart/add`, item, {
        headers: { Authorization: `Bearer ${token}` },
      });
      dispatch({ type: actionTypes.SET_CART, payload: response.data.cartData });
      toast.success("Item added to cart.");
    } catch (error) {
      toast.error("Failed to add item to cart.");
      dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
    } finally {
      dispatch({ type: actionTypes.SET_LOADING, payload: false });
    }
  }, [backendUrl, token]);

  // Update Cart Quantity
  const updateCartQuantity = useCallback(async (item) => {
    try {
      dispatch({ type: actionTypes.SET_LOADING, payload: true });
      const response = await axios.post(`${backendUrl}/api/cart/update`, item, {
        headers: { Authorization: `Bearer ${token}` },
      });
      dispatch({ type: actionTypes.SET_CART, payload: response.data.cartData });
    } catch (error) {
      toast.error("Failed to update cart.");
      dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
    } finally {
      dispatch({ type: actionTypes.SET_LOADING, payload: false });
    }
  }, [backendUrl, token]);

  // Remove Item from Cart
  const removeFromCart = useCallback(async (item) => {
    try {
      dispatch({ type: actionTypes.SET_LOADING, payload: true });
      const response = await axios.post(`${backendUrl}/api/cart/update`, { ...item, quantity: 0 }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      dispatch({ type: actionTypes.SET_CART, payload: response.data.cartData });
      toast.success("Item removed from cart.");
    } catch (error) {
      toast.error("Failed to remove item from cart.");
      dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
    } finally {
      dispatch({ type: actionTypes.SET_LOADING, payload: false });
    }
  }, [backendUrl, token]);

  return {
    state,
    fetchProvinces,
    fetchCities,
    calculateShippingCost,
    fetchProducts,
    fetchCart,
    addToCart,
    updateCartQuantity,
    removeFromCart,
  };
};

export default useEcommerce;
