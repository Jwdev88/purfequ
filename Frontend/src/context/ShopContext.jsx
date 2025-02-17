// --- context/ShopContext.jsx ---
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
    // ... (reducer remains the same) ...
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
            return state;
    }
  };
  
  const ShopContextProvider = ({ children }) => {
    const [state, dispatch] = useReducer(reducer, initialState);
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    const navigate = useNavigate();
  
    // Helper function for consistent notifications
    const notify = (type, message) => {
      toast[type](message, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    };
  
    const formatIDR = useCallback(
      (amount) => (
        <FormatRupiah value={amount} decimalSeparator="," thousandSeparator="." />
      ),
      []
    );
  
    const setToken = useCallback((token) => {
      localStorage.setItem("token", token);
      dispatch({ type: shopActionTypes.SET_TOKEN, payload: token });
    }, []);
  
    const setSearch = (search) => {
      dispatch({ type: shopActionTypes.SET_SEARCH, payload: search });
    };
  
    const toggleShowSearch = (visible) => {
      if (!visible) {
        dispatch({ type: shopActionTypes.SET_SEARCH, payload: "" }); // Reset search
      }
      dispatch({ type: shopActionTypes.TOGGLE_SHOW_SEARCH, payload: visible });
    };
  
  const fetchData = useCallback(
      async (url, actionType, errorMessage) => {
        dispatch({ type: shopActionTypes.SET_LOADING, payload: true });
  
        try {
          const response = await apiCall(url, "GET", {}, state.token);
          const data = response.data;
  
          if (data.success) {
            let payload = null;
  
            // Consolidated transformation logic
            const transformItem = (item, type) => {
                if (!item) return null;
                let transformed = { ...item };
                if (type === 'subCategory' || type === 'product') {
                    transformed.category = typeof item.category === "object" && item.category !== null
                        ? item.category._id
                        : item.category;
                }
                if (type === 'product') {
                  transformed.subCategory = typeof item.subCategory === "object" && item.subCategory !== null
                        ? item.subCategory._id
                        : item.subCategory;
                }
                return transformed;
            }
  
            switch (actionType) {
              case shopActionTypes.SET_CATEGORIES:
                payload = data.categories || [];
                break;
  
              case shopActionTypes.SET_SUBCATEGORIES:
                payload = (data.subCategories || []).map(subCat => transformItem(subCat, 'subCategory'));
                break;
  
              case shopActionTypes.SET_PRODUCTS:
                payload = (data.products || []).map(product => transformItem(product, 'product'));
                break;
            }
  
            if (payload !== null) {
              dispatch({ type: actionType, payload });
            } else {
              notify("error", errorMessage);
            }
          } else {
            throw new Error(data.message || errorMessage);
          }
        } catch (error) {
          notify("error", error.message || errorMessage);
        } finally {
          dispatch({ type: shopActionTypes.SET_LOADING, payload: false });
        }
      },
      [state.token, dispatch] // Add dispatch to dependencies
    );
  
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
        notify(
          "error",
          error.message || "Kesalahan saat mengambil data keranjang."
        );
      }
    }, [backendUrl, state.token, dispatch]);
  
  
  useEffect(() => {
    if (state.token) getUserCart();
  }, [state.token, getUserCart]);
  
  
  
    const updateQuantity = useCallback(
      async (productId, variantId, optionId, quantity) => {
        if (!productId || quantity < 1) {
          notify("error", "Data tidak valid untuk memperbarui kuantitas.");
  
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
            dispatch({
              type: shopActionTypes.SET_CART_ITEMS,
              payload: response.data.cartItems,
            });
  
            return response.data.cartItems;
          } else {
            throw new Error(
              response.data.message || "Gagal memperbarui kuantitas."
            );
          }
        } catch (error) {
          notify(
            "error",
            error.message || "Kesalahan saat memperbarui kuantitas keranjang."
          );
        throw error
        }
      },
      [backendUrl, state.token, dispatch] // Add dispatch
    );
  
    const addToCart = useCallback(
      async (productId, variantId, optionId, quantity) => {
        if (!productId || quantity < 1) {
          notify("error", "Data tidak valid untuk menambahkan ke keranjang.");
          return;
        }
  
        // Check if the item is already in the cart.
        const existingItem = state.cartItems.find(
          (item) =>
            item.productId === productId &&
            (!variantId || item.variant?.variantId === variantId) &&
            (!optionId || item.variant?.selectedOption?.optionId === optionId)
        );
  
        if (existingItem) {
            // If the item exists, update its quantity.
          try{
              const newQuantity = existingItem.quantity + quantity;
              await updateQuantity(productId, variantId, optionId, newQuantity)
              return; // Exit after updateQuantity
          } catch (error) {
              //updateQuantity has notify
              return
          }
  
        } else {
            // If not, add as a new item
          try {
            const response = await apiCall(
              `${backendUrl}/api/cart/add`,
              "POST",
              { productId, variantId, optionId, quantity },
              state.token
            );
  
            if (response.data.success) {
                  // Update cartItems with the new cart data *from the server*.
                  dispatch({
                    type: shopActionTypes.SET_CART_ITEMS,
                    payload: response.data.cartData, // Use cartData, not cartItems
                  });
              notify("success", "Produk berhasil ditambahkan ke keranjang.");
            } else {
              throw new Error(response.data.message || "Gagal menambahkan ke keranjang.");
            }
          } catch (error) {
              notify("error", error.message || "Gagal menambahkan ke keranjang.");
          }
        }
      },
      [backendUrl, state.token, state.cartItems, updateQuantity, dispatch]
    );
  
// --- context/ShopContext.jsx --- (Continued)

const removeItemFromCart = useCallback(
    async (productId, variantId, optionId) => {
      try {
        // Directly call the update endpoint with quantity 0.
        const response = await apiCall(
          `${backendUrl}/api/cart/update`,
          "POST",
          { productId, variantId, optionId, quantity: 0 }, // Set quantity to 0
          state.token
        );

        if (response.data.success) {
          dispatch({
            type: shopActionTypes.SET_CART_ITEMS,
            payload: response.data.cartItems,
          });
          notify("success", "Item removed from cart.");
        } else {
          throw new Error(
            response.data.message || "Failed to remove item from cart."
          );
        }
      } catch (error) {
        notify(
          "error",
          error.message || "Failed to remove item from cart."
        );
      }
    },
    [backendUrl, state.token, dispatch] // Add dispatch
  );

  const clearCart = useCallback(async (itemIdsToRemove) => {
    try {
        if (itemIdsToRemove && Array.isArray(itemIdsToRemove) && itemIdsToRemove.length > 0) {
            // Remove specific items
            const response = await apiCall(
              `${backendUrl}/api/cart/remove-items`, // New backend endpoint
              "POST", // Or DELETE, depending on your API
              { itemIds: itemIdsToRemove },
              state.token
            );
            if (response.data.success) {
              // Update cartItems state, removing the specified items
                dispatch({
                  type: shopActionTypes.SET_CART_ITEMS,
                  payload: response.data.cartItems, // Assuming the backend returns the updated cart
                });
                notify("success", "Selected items removed from cart.");
            } else {
                throw new Error(response.data.message || "Failed to remove items from cart.");
            }

        } else {
          // Clear the entire cart
          const response = await apiCall(
            `${backendUrl}/api/cart/clear`,
            "POST",
            {},
            state.token
          );
          if (response.data.success) {
            dispatch({ type: shopActionTypes.SET_CART_ITEMS, payload: [] });
            notify("success", "Cart cleared successfully.");

          } else {
            throw new Error(response.data.message || "Failed to clear cart.");
          }
        }
    } catch (error) {
      notify("error", error.message || "Failed to clear cart.");
    }
}, [backendUrl, state.token, dispatch]); // Add dispatch to dependencies

    // New function: clearSelectedItemsFromCart
  const clearSelectedItemsFromCart = useCallback(async (itemIds) => {
    try {
      await clearCart(itemIds); // Call the modified clearCart
    } catch (error) {
      // Error handling is already done within clearCart
    }
  }, [clearCart]); // Depend on the modified clearCart

const getCountCart = useCallback(() => {
    const uniqueItems = new Set();
    state.cartItems.forEach(item => {
        // Construct a unique key for each item, handling missing properties
        const productId = item.productId ? item.productId.toString() : 'no-product';
        const variantId = item.variant?.variantId ? item.variant.variantId.toString() : 'no-variant';
        const optionId = item.variant?.selectedOption?.optionId ? item.variant.selectedOption.optionId.toString() : 'no-option';

        const key = `${productId}-${variantId}-${optionId}`;
        uniqueItems.add(key);
    });
    return uniqueItems.size; // Return the count of unique items
}, [state.cartItems]);

const getCartAmount = useCallback(() => {
    const totalAmount = state.cartItems.reduce((amount, item) => {
      const itemPrice = parseFloat(
        item.variant?.selectedOption?.optionPrice ?? item.productPrice ?? 0
      );
      const itemQuantity = parseInt(item.quantity, 10) || 0;  // Ensure quantity is a number
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
    clearSelectedItemsFromCart, // Add the new function to the context
  };

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
};

export default ShopContextProvider;