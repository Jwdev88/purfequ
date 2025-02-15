// --- hooks/usePlaceOrder.js ---
import { useReducer, useCallback, useEffect, useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import { toast } from "react-toastify";
import { apiCall } from "../utils/apiCall";

const initialState = {
  formData: {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    state: "",
    postalCode: "",
    province: "",
    city: "",
  },
  provinces: [],
  cities: [],
  isLoading: false, // Only for the submit button
  isLoadingAddress: false,
  isLoadingCost: false,
  cost: null,
  selectedService: null,
  orderId: null,
};

const reducer = (state, action) => {
  switch (action.type) {
    case "SET_FORM_DATA":
      return { ...state, formData: { ...state.formData, ...action.payload } };
    case "SET_PROVINCES":
      return { ...state, provinces: action.payload };
    case "SET_CITIES":
      return { ...state, cities: action.payload };
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_LOADING_ADDRESS":
      return { ...state, isLoadingAddress: action.payload };
    case "SET_LOADING_COST":
      return { ...state, isLoadingCost: action.payload };
    case "SET_COST":
      return { ...state, cost: action.payload };
    case "SET_SELECTED_SERVICE":
      return { ...state, selectedService: action.payload };
    case "SET_SELECTED_PROVINCE":
      return {
        ...state,
        formData: { ...state.formData, province: action.payload, city: "" },
        cities: [], // Clear cities when province changes
      };
    case "SET_SELECTED_CITY":
      return {
        ...state,
        formData: { ...state.formData, city: action.payload },
      };
    case "SET_ORDER_ID":
      return { ...state, orderId: action.payload };
    case "RESET_FORM":
      return {
        ...initialState,
        provinces: state.provinces, // Keep provinces!
        isLoadingAddress: false, // Ensure address loading is off
      };
    default:
      return state;
  }
};

const usePlaceOrder = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const navigate = useNavigate();
  const { clearSelectedItemsFromCart, backendUrl, token, cartItems } =
    useContext(ShopContext); // Correctly get cartItems

  const citiesCache = useMemo(() => new Map(), []);

  // --- Fetch Provinces (No Changes) ---
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const response = await apiCall(
          `${backendUrl}/api/rajaongkir/provinces`,
          "GET",
          {},
          token
        );
        if (!response.data.success) {
          throw new Error(response.data.message || "Failed to fetch provinces");
        }
        dispatch({ type: "SET_PROVINCES", payload: response.data.provinces });
      } catch (error) {
        console.error(error);
        toast.error(error.message || "Failed to fetch provinces.");
      }
    };
    fetchProvinces();
  }, [backendUrl, token]);

  // --- Fetch Cities (No Changes) ---
  const fetchCities = useCallback(
    async (provinceId) => {
      if (!provinceId) {
        dispatch({ type: "SET_CITIES", payload: [] });
        return;
      }

      if (citiesCache.has(provinceId)) {
        dispatch({ type: "SET_CITIES", payload: citiesCache.get(provinceId) });
        return;
      }

      try {
        const response = await apiCall(
          `${backendUrl}/api/rajaongkir/cities/${provinceId}`,
          "GET",
          {},
          token
        );
        if (!response.data.success) {
          throw new Error(response.data.message || "Failed to fetch cities");
        }
        citiesCache.set(provinceId, response.data.cities);
        dispatch({ type: "SET_CITIES", payload: response.data.cities });
      } catch (error) {
        console.error("Error fetching cities:", error);
        toast.error(error.message || "Failed to fetch cities.");
        dispatch({ type: "SET_CITIES", payload: [] });
      }
    },
    [backendUrl, token, citiesCache]
  );
  // --- Prefill Address ---
  useEffect(() => {
    const fetchUserAddresses = async () => {
      try {
        dispatch({ type: "SET_LOADING_ADDRESS", payload: true });
        const response = await apiCall(
          `${backendUrl}/api/user/addresses`,
          "GET",
          {},
          token
        );
        if (!response.ok) {
          throw new Error(response.data.message || "Failed to fetch addresses");
        }

        const addresses = response.data.addresses;
        if (addresses && addresses.length > 0) {
          const defaultAddress = addresses[0];
          dispatch({
            type: "SET_FORM_DATA",
            payload: {
              firstName: defaultAddress.firstName,
              lastName: defaultAddress.lastName,
              email: defaultAddress.email,
              phone: defaultAddress.phone,
              address: defaultAddress.street,
              province: defaultAddress.provinceId,
              city: defaultAddress.cityId,
              state: defaultAddress.state,
              postalCode: defaultAddress.postalCode,
            },
          });

          if (defaultAddress.provinceId) {
            await fetchCities(defaultAddress.provinceId);
          }
        }
      } catch (error) {
        console.error("Error fetching user addresses:", error);
        toast.error(error.message || "Failed to fetch user address.");
      } finally {
        dispatch({ type: "SET_LOADING_ADDRESS", payload: false });
      }
    };

    if (token) {
      fetchUserAddresses();
    }
  }, [backendUrl, token, fetchCities]);

  // --- Calculate Shipping Cost (using itemsToCheckout) ---
  const calculateShippingCost = useCallback(async () => {
    if (!state.formData.city || state.cities.length === 0) {
      dispatch({ type: "SET_COST", payload: null });
      return;
    }

    dispatch({ type: "SET_LOADING_COST", payload: true });

    // --- CORRECTED: Get itemsToCheckout here ---
    const buyNowItem = localStorage.getItem("buyNowItem");
    const checkoutItems = localStorage.getItem("checkoutItems");
    let itemsToUse = [];

    if (buyNowItem) {
      try {
        itemsToUse = [JSON.parse(buyNowItem)]; // Buy Now item
      } catch (error) {
        console.error("Error parsing buyNowItem:", error);
        toast.error("Invalid buy now item data.");
        dispatch({ type: "SET_LOADING_COST", payload: false }); // Stop loading
        return;
      }
    } else if (checkoutItems) {
      try {
        itemsToUse = JSON.parse(checkoutItems); // Selected cart items
      } catch (error) {
        console.error("Error parsing checkoutItems:", error);
        toast.error("Invalid checkout items data.");
        dispatch({ type: "SET_LOADING_COST", payload: false }); // Stop loading
        return;
      }
    } else {
      // No items to checkout
      dispatch({ type: "SET_LOADING_COST", payload: false });
      return;
    }
    // --- END Corrected itemsToCheckout Logic ---

    try {
      const totalWeightGram = itemsToUse.reduce((total, item) => {
        const itemWeight =
          item.variant?.selectedOption?.optionWeight ?? item.productWeight ?? 0;
        return total + itemWeight * (item.quantity || 1); //Default to quantity 1
      }, 0);

      const payload = {
        origin: "501", // <<---  REPLACE WITH YOUR ORIGIN!
        destination: state.formData.city,
        weight: totalWeightGram, // Use calculated weight, in grams
        courier: "jne", // Consider making this dynamic
      };

      const response = await apiCall(
        `${backendUrl}/api/rajaongkir/cost`,
        "POST",
        payload,
        token
      );

      if (!response.data.success) {
        throw new Error(
          response.data.message || "Failed to fetch shipping cost"
        );
      }
      dispatch({ type: "SET_COST", payload: response.data.costs });
    } catch (error) {
      console.error("Error fetching shipping cost:", error);
      toast.error(error.message);
      dispatch({ type: "SET_COST", payload: null });
    } finally {
      dispatch({ type: "SET_LOADING_COST", payload: false });
    }
  }, [backendUrl, state.formData.city, state.cities.length, token, cartItems]); // Add cartItems as dependency

  // --- Trigger Shipping Cost Calculation (useEffect) ---
  useEffect(() => {
    if (state.formData.city && state.cities.length > 0) {
      calculateShippingCost();
    }
  }, [state.formData.city, state.cities.length, calculateShippingCost]);

  // --- Trigger fetchCities when province changes ---
  useEffect(() => {
    if (state.formData.province) {
      fetchCities(state.formData.province);
    }
  }, [state.formData.province, fetchCities]);

  // --- Handlers (No Changes) ---
  const handleProvinceChange = useCallback(
    (provinceId) => {
      dispatch({ type: "SET_SELECTED_PROVINCE", payload: provinceId });
    },
    [dispatch]
  );

  const handleCityChange = useCallback(
    (cityId) => {
      dispatch({ type: "SET_SELECTED_CITY", payload: cityId });
    },
    [dispatch]
  );

  const handleServiceSelect = useCallback(
    (service) => {
      dispatch({ type: "SET_SELECTED_SERVICE", payload: service });
    },
    [dispatch]
  );

  const handleOrderSubmission = async (orderData) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      const response = await apiCall(
        `${backendUrl}/api/order/midtrans`,
        "POST",
        orderData,
        token
      );

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to create order");
      }

      const { token: midtransToken, orderId, redirect_url } = response.data;

      if (!midtransToken || !orderId) {
        dispatch({ type: "SET_LOADING", payload: false });
        toast.error("Failed to get payment token from Midtrans.");
        return;
      }

      localStorage.setItem("orderId", orderId);
      dispatch({ type: "SET_ORDER_ID", payload: orderId });

      // --- Handle Clearing Cart (Conditional) ---
      const buyNowItem = localStorage.getItem("buyNowItem");
      if (buyNowItem) {
        // Don't clear cart on "Buy Now"
        // console.log("Buy Now order.  Not clearing cart.");
      } else {
        // Clear *only selected items* after successful cart checkout
        const checkoutItems = JSON.parse(
          localStorage.getItem("checkoutItems") || "[]"
        );
        if (checkoutItems.length > 0) {
          const itemIdsToRemove = checkoutItems.map((item) => {
            // Construct the same key used in Cart.jsx for selection
            return `${item.productId}-${
              item.variant?.variantId || "no-variant"
            }-${item.variant?.selectedOption?.optionId || "no-option"}`;
          });
          await clearSelectedItemsFromCart(itemIdsToRemove); // Call the new function
        }
      }
      // --- END Handle Clearing Cart ---

      // --- Midtrans Payment Handling ---
      if (window.snap) {
        window.snap.pay(midtransToken, {
          onSuccess: (result) => {
            console.log("Midtrans success:", result);
            toast.success("Payment successful!");
            //Cart cleared based on buy now or check out
            localStorage.removeItem("orderId");
            localStorage.removeItem("buyNowItem"); //  <--  ADD THIS
            navigate("/orders");
          },
          onPending: (result) => {
            console.log("Midtrans pending:", result);
            toast.info("Payment pending. Please check your order status.");
            localStorage.removeItem("orderId");
            navigate("/orders");
          },
          onError: (result) => {
            console.log("Midtrans error:", result);
            dispatch({ type: "SET_LOADING", payload: false });
            dispatch({ type: "RESET_FORM" }); //reset form

            toast.error("Payment failed! Please try again.");
          },
          onClose: () => {
            console.log("Midtrans closed");
            dispatch({ type: "SET_LOADING", payload: false });
            toast.warn("Payment window closed.");
            navigate(`/orders?orderId=${orderId}`);
            dispatch({ type: "RESET_FORM" }); //reset form
          },
        });
      } else {
        window.location.href = redirect_url;
      }
    } catch (error) {
      console.error("Error creating order:", error);
      dispatch({ type: "SET_LOADING", payload: false });
      toast.error(error.message || "Failed to create order.");
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  return {
    state,
    dispatch,
    handleProvinceChange,
    handleCityChange,
    handleOrderSubmission,
    handleServiceSelect,
  };
};

export default usePlaceOrder;
