import React, { createContext, useEffect, useState } from "react";


import { FormatRupiah } from "@arismun/format-rupiah";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export const ShopContext = createContext();

const ShopContextProvider = (props) => {
  const formatIDR = (amount) => {
    return (
      <FormatRupiah
        value={amount}
        decimalSeparator=","
        thousandSeparator="."
      />
    );
  };

  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const [token, setToken] = useState("");
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [products, setProducts] = useState([]);

  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [weight, setWeight] = useState(1);
  const [courier, setCourier] = useState("jne");
  const [cost, setCost] = useState(null);

  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const response = await axios.get(backendUrl + "/api/rajaongkir/provinces");
        setProvinces(response.data.provinces);
      } catch (error) {
        console.error("Error fetching provinces:", error);
        toast.error("Failed to fetch provinces.");
      }
    };

    fetchProvinces();
  }, []);

  const fetchCities = async (provinceId) => {
    try {
      const response = await axios.get(backendUrl + "/api/rajaongkir/cities/" + provinceId);
      setCities(response.data);
    } catch (error) {
      console.error("Error fetching cities:", error);
      toast.error("Failed to fetch cities.");
    }
  };

  const calculateCost = async (destination, weight, courier) => {
    try {
      const response = await axios.post(backendUrl + "/api/rajaongkir/cost", {
        origin: 455,
        destination: destination,
        weight: weight,
        courier: courier,
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching cost:", error);
      toast.error("Failed to calculate shipping cost.");
      return null;
    }
  };

  const addToCart = async (itemId, selectedVariants) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        return { success: false, message: "You must be logged in to add items to cart" };
      }
  
      // Construct payload to send to backend
      const payload = {
        productId: itemId,
        selectedVariants: selectedVariants,
        quantity: 1, // Default quantity
      };
  
      // Send data to backend
      const response = await axios.post(
        `${backendUrl}/api/cart/add`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      // Handle response from backend
      if (response.data && response.data.success) {
        return { success: true, message: "Item successfully added to cart" };
      } else {
        return { success: false, message: response.data.message || "Failed to add item to cart" };
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      return { success: false, message: error.response?.data?.message || "An error occurred" };
    }
  };
  

  const getCartCount = () => {
    let totalCount = 0;

    for (const items in cartItems) {
      for (const item in cartItems[items]) {
        try {
          if (cartItems[items][item] > 0) {
            totalCount += cartItems[items][item];
          }
        } catch (error) {
          console.error("Error calculating cart count:", error);
        }
      }
    }

    return totalCount;
  };

  const getCartAmount = () => {
    let totalAmount = 0;

    for (const items in cartItems) {
      let itemInfo = products.find((product) => product._id === items);
      for (const item in cartItems[items]) {
        try {
          if (cartItems[items][item] > 0) {
            totalAmount += itemInfo.price * cartItems[items][item];
          }
        } catch (error) {
          console.error("Error calculating cart amount:", error);
        }
      }
    }

    return totalAmount;
  };

  const getProductsData = async () => {
    try {
      const response = await axios.get(backendUrl + "/api/product/list");
      if (response.data.success) {
        const productsWithNumberPrice = response.data.products.map((product) => {
          const price = Number(product.price);
          if (isNaN(price)) {
            console.error("Invalid price value for product:", product);
            return { ...product, price: 0 }; // Handle invalid price
          }
          return { ...product, price: price };
        });
        setProducts(productsWithNumberPrice);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  useEffect(() => {
    getProductsData();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");
  
    if (token && userId) {
      setToken(token);
      setUserId(userId);
    }
  }, []);
  

  const updateQuantity = async (itemId, size, quantity) => {
    let cartData = structuredClone(cartItems);
    cartData[itemId][size] = quantity;
    setCartItems(cartData);

    if (token) {
      try {
        await axios.post(backendUrl + "/api/cart/update", { itemId, size, quantity }, { headers: { token } });
      } catch (error) {
        console.log(error);
        toast.error(error.message);
      }
    }
  };

  const getUserCart = async (token) => {
    try {
      const response = await axios.post(backendUrl + "/api/cart/get", {}, { headers: { token } });
      if (response.data.success) {
        setCartItems(response.data.cartData);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  const clearCart = (token) => {
    setCartItems({});
    if (token) {
      axios.post(backendUrl + "/api/cart/clear", {}, { headers: { token } })
        .then((response) => {
          if (response.data.success) {
            toast.success("Cart cleared successfully");
          } else {
            console.error("Error clearing cart:", response.data.message);
            toast.error(response.data.message || "Failed to clear cart.");
          }
        })
        .catch((error) => {
          console.error("Error clearing cart:", error);
          toast.error("Failed to clear cart. Please try again later.");
        });
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
    updateQuantity,
    getCartAmount,
    navigate,
    backendUrl,
    setToken,
    token,
    setCartItems,
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
    <ShopContext.Provider value={value}>{props.children}</ShopContext.Provider>
  );
};

export default ShopContextProvider;
