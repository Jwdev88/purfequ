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
        decimalSeparator="," // Use comma as the decimal separator
        thousandSeparator="." // Use period as the thousand separator
      />
    );
  };
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const [token, setToken] = useState("");
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState({});
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState("");

  const [selectedCity, setSelectedCity] = useState("");
  const [weight, setWeight] = useState(1);
  const [courier, setCourier] = useState("jne");
  const [cost, setCost] = useState(null);
  //useEffect untuk mengambil data provinsi
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const response = await axios.get(
          backendUrl + "/api/rajaongkir/provinces",
          {}
        );
        setProvinces(response.data.provinces);
      } catch (error) {
        console.error("Error fetching provinces:", error);
      }
    };

    if (window.location.pathname === "/") {
      fetchProvinces();
    }
  }, []);
  const ProductDetail = ({ productData }) => {
    if (!productData) {
      return <div>Loading...</div>; // or handle the error appropriately
    }
    
  useEffect(() => {
    // Fetch products from API or local data
    fetchProducts().then((data) => setProducts(data));
  }, []);
  const Cart = ({ product }) => {
    if (!product || !product.variants) {
      return <div>Product data is not available</div>;
    }
  
    return (
      <div>
        {/* Render product variants */}
        {product.variants.map((variant) => (
          <div key={variant.name}>{variant.name}</div>
        ))}
      </div>
    );
  };
  
    // Proceed with rendering once productData is available
    return (
      <div>
        <h1>{productData.name}</h1>
        {/* Other product details */}
      </div>
    );
  };
  //use effect untuk mengambil data kota
  const fetchCities = async (provinceId) => {
    try {
      const response = await axios.get(
        backendUrl + "/api/rajaongkir/cities/" + provinceId
      );
      setCities(response.data);
    } catch (error) {
      console.error("Error fetching cities:", error);
    }
  };
  //function untuk menghitung cost
  const calculateCost = async (destination, weight, courier) => {
    try {
      const response = await axios.post(backendUrl + "/api/rajaongkir/cost", {
        origin: 455, // ID Kota Tangerang (hardcoded di backend)
        destination: destination,
        weight: weight,
        courier: courier,
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching cost:", error);
      return null;
    }
  };

  //function untuk menambahkan item ke cart
  const addToCart = async (itemId, variantName, variantOption) => {
    if (!token) {
      toast.error("Please log in to add items to the cart.");
      return;
    }
  
    if (!products.length) {
      toast.error("Products are not loaded yet. Please try again later.");
      return;
    }
  
    const product = products.find((p) => p._id === itemId);
    if (!product) {
      toast.error("Invalid product selected.");
      return;
    }
  
    const variant = product.variants?.find((v) => v._id === variantName || v.name === variantName);
    if (!variant) {
      toast.error(`Variant "${variantName}" does not exist for this product.`);
      return;
    }
  
    if (!variantOption) {
      toast.error(`No option selected for the variant "${variantName}".`);
      return;
    }
  
    const option = variant.options?.find((o) => o._id === variantOption || o.name === variantOption);
    if (!option) {
      toast.error(`Option "${variantOption}" does not exist for the variant "${variantName}".`);
      return;
    }
  
    // Proceed with adding to cart
    try {
      const response = await axios.post(
        `${backendUrl}/api/cart/add`,
        { itemId, variantName, variantOption },
        { headers: { token } }
      );
  
      if (response.data.success) {
        let cartData = structuredClone(cartItems);
        if (cartData[itemId]) {
          if (cartData[itemId][variantName]) {
            cartData[itemId][variantName][variantOption] =
              (cartData[itemId][variantName][variantOption] || 0) + 1;
          } else {
            cartData[itemId][variantName] = { [variantOption]: 1 };
          }
        } else {
          cartData[itemId] = { [variantName]: { [variantOption]: 1 } };
        }
        setCartItems(cartData);
        toast.success("Item added to cart");
      } else {
        toast.error(response.data.message || "Failed to add item to cart.");
      }
    } catch (error) {
      console.error("Error adding to cart:", error.response?.data || error.message);
      toast.error("An unexpected error occurred. Please try again.");
    }
  };


  //function untuk menghapus item di cart
  const getCartCount = () => {
    let totalCount = 0;

    for (const itemId in cartItems) {
      for (const variantName in cartItems[itemId]) {
        for (const variantOption in cartItems[itemId][variantName]) {
          try {
            if (cartItems[itemId][variantName][variantOption] > 0) {
              totalCount += cartItems[itemId][variantName][variantOption];
            }
          } catch (error) {}
        }
      }
    }
    return totalCount;
  };

  //function untuk menghitung total harga
const getCartAmount = () => {
  let totalAmount = 0;

  for (const itemId in cartItems) {
    const itemInfo = products.find((product) => product._id === itemId);

    if (!itemInfo) {
      console.warn(`Product with ID ${itemId} not found.`);
      continue;
    }

    for (const variantName in cartItems[itemId]) {
      const variant = itemInfo.variants.find((v) => v.name === variantName);

      if (!variant) {
        console.warn(`Variant "${variantName}" not found for product ID ${itemId}.`);
        continue;
      }

      for (const variantOption in cartItems[itemId][variantName]) {
        const option = variant.options.find((o) => o.name === variantOption);

        if (!option) {
          console.warn(`Option "${variantOption}" not found for variant "${variantName}".`);
          continue;
        }

        const quantity = cartItems[itemId][variantName][variantOption];
        if (quantity > 0) {
          totalAmount += option.price * quantity;
        }
      }
    }
  }

  return totalAmount;
};

  //function untuk mengambil data produk

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(backendUrl + "/api/product/list", {
        headers: { token },
      });

      if (response.data.success) {
        setProducts(response.data.products);
      } else {
        toast.error("Failed to fetch products");
      }
    } catch (error) {
      toast.error("Error fetching products:", error.message);
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchProducts();
  }, [token]);

  useEffect(() => {
    if (!token && localStorage.getItem("token")) {
      setToken(localStorage.getItem("token"));
      getUserCart(localStorage.getItem("token"));
    }
  }, []);

  const updateQuanity = async (
    itemId,
    variantName,
    variantOption,
    quantity
  ) => {
    let cartData = structuredClone(cartItems);

    if (cartData[itemId] && cartData[itemId][variantName]) {
      cartData[itemId][variantName][variantOption] = quantity;
    }

    setCartItems(cartData);

    if (token) {
      try {
        await axios.post(
          backendUrl + "/api/cart/update",
          { itemId, variantName, variantOption, quantity },
          { headers: { token } }
        );
      } catch (error) {
        console.log(error);
        toast.error(error.message);
      }
    }
  };

  const getUserCart = async (token) => {
    try {
      const response = await axios.post(
        backendUrl + "/api/cart/get",
        {},
        { headers: { token } }
      );
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
      axios
        .post(backendUrl + "/api/cart/clear", {}, { headers: { token } })
        .then((response) => {
          if (response.data.success) {
            toast.success("Cart cleared successfully");
          } else {
            console.error("Error clearing cart:", response.data.message);
            toast.error(response.data.message || "Failed to clear cart."); // Tampilkan pesan error dari backend atau pesan default
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
    updateQuanity,
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
