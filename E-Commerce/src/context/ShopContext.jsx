import React, { createContext, useEffect, useState } from "react";
import { FormatRupiah } from "@arismun/format-rupiah";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export const ShopContext = createContext();

const ShopContextProvider = (props) => {
  const formatIDR = (amount) => (
    <FormatRupiah
      value={amount}
      decimalSeparator=","
      thousandSeparator="."
    />
  );

  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [weight, setWeight] = useState(1);
  const [courier, setCourier] = useState("jne");
  const [cost, setCost] = useState(null);
  const navigate = useNavigate();

  // Fetch provinces
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const response = await axios.get(`${backendUrl}/api/rajaongkir/provinces`);
        setProvinces(response.data.provinces);
      } catch (error) {
        console.error("Error fetching provinces:", error);
        toast.error("Failed to fetch provinces.");
      }
    };
    fetchProvinces();
  }, [backendUrl]);

  const fetchCities = async (provinceId) => {
    try {
      const response = await axios.get(`${backendUrl}/api/rajaongkir/cities/${provinceId}`);
      setCities(response.data);
    } catch (error) {
      console.error("Error fetching cities:", error);
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
      return response.data;
    } catch (error) {
      console.error("Error calculating cost:", error);
      toast.error("Failed to calculate shipping cost.");
      return null;
    }
  };

  // Add to Cart
  const addToCart = async (productId, variantArray, quantity = 1) => {
    try {
      const response = await axios.post(
        `${backendUrl}/api/cart/add`,
        {
          productId,
          variantId: variantArray,
          quantity,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
  
      return response.data; // Respons harus memiliki { success: true, cart: updatedCart }
    } catch (error) {
      console.error("Error in addToCart:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Failed to add product to cart.",
      };
    }
  };
  
  

  const getCartCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

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

  const getProductsData = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/product/list`);
      if (response.data.success) {
        setProducts(response.data.products);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error(error.message || "Failed to fetch products.");
    }
  };

  useEffect(() => {
    getProductsData();
  }, [backendUrl]);

  useEffect(() => {
    if (token) {
      getUserCart(token);
    }
  }, [token]);

  const updateQuantity = async (cartItemId, quantity) => {
    try {
      const response = await axios.post(
        `${backendUrl}/api/cart/update`,
        { cartItemId, quantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setCartItems(response.data.cart); // Update cart state with the latest data
        toast.success("Cart updated successfully!");
      } else {
        toast.error(response.data.message || "Failed to update cart.");
      }
    } catch (error) {
      console.error("Error updating cart quantity:", error);
      toast.error(error.response?.data?.message || "Failed to update cart.");
    }
  };

  const getUserCart = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/cart/get`, {
        headers: { Authorization: `Bearer ${token}` }, // Token from auth context or localStorage
      });
  
      if (response.data.success) {
        setCartItems(response.data.cartData); // Update cart data in state
      } else {
        toast.error(response.data.message || "Failed to fetch cart.");
      }
    } catch (error) {
      console.error("Error fetching user cart:", error);
      toast.error(error.response?.data?.message || "Failed to fetch cart.");
    }
  };
  

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
      console.error("Error clearing cart:", error);
      toast.error("Failed to clear cart. Please try again later.");
    }
  };

  const value = {
    products,
    search,
    setSearch,
    showSearch,
    setShowSearch,
    cartItems,
    addToCart,
    getCartCount,
    getCartAmount,
    updateQuantity,
    navigate,
    backendUrl,
    setToken,
    token,
    provinces,
    cities,
    selectedProvince,
    setSelectedProvince,
    selectedCity,
    setSelectedCity,
    fetchCities,
    calculateCost,
    formatIDR,
    clearCart,
  };

  return (
    <ShopContext.Provider value={value}>
      {props.children}
    </ShopContext.Provider>
  );
};

export default ShopContextProvider;
