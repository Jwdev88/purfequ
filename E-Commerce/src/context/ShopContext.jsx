import React, { createContext, useEffect, useState } from "react";
import { FormatRupiah } from "@arismun/format-rupiah";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export const ShopContext = createContext();

const ShopContextProvider = (props) => {
  const formatIDR = (amount) => <FormatRupiah value={amount} decimalSeparator="," thousandSeparator="." />;

  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const navigate = useNavigate();
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [cartItems, setCartItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [weight, setWeight] = useState(1);
  const [courier, setCourier] = useState("jne");
  const [cost, setCost] = useState(null);

  // Fetch provinces
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const response = await axios.get(`${backendUrl}/api/rajaongkir/provinces`);
        setProvinces(response.data.provinces);
      } catch (error) {
        toast.error("Failed to fetch provinces.");
      }
    };
    fetchProvinces();
  }, [backendUrl]);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(`${backendUrl}/api/product/list`);
        if (response.data.success) {
          setProducts(response.data.products);
        } else {
          toast.error(response.data.message || "Failed to fetch products.");
        }
      } catch (error) {
        toast.error(error.message || "Failed to fetch products.");
      }
    };
    fetchProducts();
  }, [backendUrl]);

  // Fetch cart when token is available
  useEffect(() => {
    if (token) {
      getUserCart(token);
    }
  }, [token, backendUrl]);

  const fetchCities = async (provinceId) => {
    try {
      const response = await axios.get(`${backendUrl}/api/rajaongkir/cities/${provinceId}`);
      setCities(response.data);
    } catch (error) {
      toast.error("Failed to fetch cities.");
    }
  };

  const calculateCost = async (destination, weight, courier) => {
    try {
      const response = await axios.post(`${backendUrl}/api/rajaongkir/cost`, {
        origin: 455,
        destination,
        weight,
        courier,
      });
      setCost(response.data);
    } catch (error) {
      toast.error("Failed to calculate shipping cost.");
    }
  };

  // Add item to cart
  const addToCart = async (productId, variantArray, quantity = 1) => {
    let updatedCart = structuredClone(cartItems);

    const existingItemIndex = updatedCart.findIndex(
      (item) => item.productId === productId && item.variantId === variantArray
    );
    if (existingItemIndex > -1) {
      updatedCart[existingItemIndex].quantity += quantity;
    } else {
      updatedCart.push({ productId, variantId: variantArray, quantity });
    }

    setCartItems(updatedCart);

    // Sync with backend
    if (token) {
      try {
        const response = await axios.post(
          `${backendUrl}/api/cart/add`,
          { productId, variantId: variantArray, quantity },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data;
      } catch (error) {
        console.error("Error in addToCart:", error);
        toast.error(error.response?.data?.message || "Failed to add product to cart.");
        return { success: false };
      }
    }
  };

  // Get total cart count
  const getCartCount = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  // Get total cart amount
  const getCartAmount = () => {
    return cartItems.reduce((total, item) => {
      const product = products.find((p) => p._id === item.productId);
      if (product) {
        const variant = product.variants
          ?.flatMap((v) => v.options)
          ?.find((opt) => opt._id === item.variantId);
        if (variant) {
          return total + variant.price * item.quantity;
        }
      }
      return total;
    }, 0);
  };

  // Get user cart data from backend
  const getUserCart = async (token) => {
    try {
      const response = await axios.get(`${backendUrl}/api/cart/get`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setCartItems(response.data.cartData || []);
      } else {
        toast.error(response.data.message || "Failed to fetch cart.");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch cart.");
    }
  };

  // Update item quantity in cart
  const updateQuantity = async (productId, variantId, optionId, quantity) => {
    // Update cart locally
    let updatedCart = structuredClone(cartItems);
    const itemIndex = updatedCart.findIndex(
      (item) => item.productId === productId && item.variantId === variantId && item.optionId === optionId
    );
  
    if (itemIndex > -1) {
      updatedCart[itemIndex].quantity = quantity;
      setCartItems(updatedCart);
  
      // Sync with backend
      if (token) {
        try {
          const response = await axios.post(
            `${backendUrl}/api/cart/update`,
            { productId, variantId, optionId, quantity },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (response.data.success) {
            toast.success("Cart updated successfully!");
            setCartItems(response.data.cart); // Update cart with latest backend data
          } else {
            toast.error(response.data.message || "Failed to update cart.");
          }
        } catch (error) {
          toast.error(error.response?.data?.message || "Failed to update cart.");
        }
      }
    }
  };
  
  // Clear cart
  const clearCart = async () => {
    try {
      const response = await axios.post(
        `${backendUrl}/api/cart/clear`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        setCartItems([]);
        toast.success("Cart cleared successfully.");
      } else {
        toast.error(response.data.message || "Failed to clear cart.");
      }
    } catch (error) {
      toast.error("Failed to clear cart.");
    }
  };

  // Context value
  const value = {
    products,
    cartItems,
    addToCart,
    getCartCount,
    getCartAmount,
    updateQuantity,
    formatIDR,
    clearCart,
    calculateCost,
    provinces,
    cities,
    selectedProvince,
    setSelectedProvince,
    selectedCity,
    setSelectedCity,
    fetchCities,
    navigate,
    setToken,
    token,
    backendUrl,
  };

  return <ShopContext.Provider value={value}>{props.children}</ShopContext.Provider>;
};

export default ShopContextProvider;
