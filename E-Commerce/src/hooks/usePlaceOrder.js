import { useReducer, useCallback, useEffect, useMemo,useContext } from "react";
import { notifySuccess, notifyError,notifyWarningWithAction } from "../components/ToastNotification";
import { useNavigate } from "react-router-dom";
import { actionTypes } from "../context/actionTypes";
import { apiCall } from "../utils/apiCall";
import { ShopContext } from "../context/ShopContext";

const initialState = {
  selectedProvince: "",
  selectedCity: "",
  cost: null,
  isLoading: false,
  formData: {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
  },
  selectedService: null,
  method: "cod",
  isLoadingCost: false,
  cities: [],
  provinces: [],
};

const reducer = (state, action) => {
  switch (action.type) {
    case actionTypes.SET_FORM_DATA:
      return { ...state, formData: { ...state.formData, ...action.payload } };
    case actionTypes.SET_SELECTED_PROVINCE:
      return {
        ...state,
        selectedProvince: action.payload,
        selectedCity: "",
        cities: [],
      };
    case actionTypes.SET_SELECTED_CITY:
      return { ...state, selectedCity: action.payload };
    case actionTypes.SET_COST:
      return { ...state, cost: action.payload };
    case actionTypes.SET_LOADING:
      return { ...state, isLoading: action.payload };
    case actionTypes.SET_SELECTED_SERVICE:
      return { ...state, selectedService: action.payload };
    case actionTypes.SET_METHOD:
      return { ...state, method: action.payload };
    case actionTypes.SET_LOADING_COST:
      return { ...state, isLoadingCost: action.payload };
    case actionTypes.SET_CITIES:
      return { ...state, cities: action.payload };
    case actionTypes.SET_PROVINCES:
      return { ...state, provinces: action.payload };
    default:
      return state;
  }
};

const usePlaceOrder = (cartItems, backendUrl, token) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { dispatch: globalDispatch } = useContext(ShopContext);
  const navigate = useNavigate();
  const citiesCache = useMemo(() => new Map(), []); // Cache to store cities by province
  // Fetch provinces on component mount
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const response = await apiCall(`${backendUrl}/api/rajaongkir/provinces`);
        dispatch({
          type: actionTypes.SET_PROVINCES,
          payload: response.data.provinces,
        });
      } catch (error) {
        notifyError("Failed to fetch provinces.");
      }
    };
    fetchProvinces();
  }, [backendUrl]);

  // Fetch cities based on selected province
  const fetchCities = useCallback(
    async (provinceId) => {
      if (citiesCache.has(provinceId)) {
        dispatch({
          type: actionTypes.SET_CITIES,
          payload: citiesCache.get(provinceId),
        });
        return;
      }

      try {
        dispatch({ type: actionTypes.SET_LOADING, payload: true });
        const response = await apiCall(`${backendUrl}/api/rajaongkir/cities/${provinceId}`);
        citiesCache.set(provinceId, response.data);
        dispatch({ type: actionTypes.SET_CITIES, payload: response.data });
      } catch (error) {
        notifyError("Failed to fetch cities.");
        dispatch({ type: actionTypes.SET_CITIES, payload: [] });
      } finally {
        dispatch({ type: actionTypes.SET_LOADING, payload: false });
      }
    },
    [backendUrl, citiesCache]
  );

  // Handle province change, reset city and fetch new cities
  const handleProvinceChange = (provinceId) => {
    if (provinceId !== state.selectedProvince) { // Prevent unnecessary updates
      dispatch({ type: actionTypes.SET_SELECTED_PROVINCE, payload: provinceId });
      dispatch({
        type: actionTypes.SET_FORM_DATA,
        payload: { selectedProvince: provinceId },
      });
      fetchCities(provinceId); // Fetch cities for the selected province
    }
  };

  // Handle city change
  const handleCityChange = (cityId) => {
    if (cityId !== state.selectedCity) { // Prevent unnecessary updates
      dispatch({ type: actionTypes.SET_SELECTED_CITY, payload: cityId });
      dispatch({
        type: actionTypes.SET_FORM_DATA,
        payload: { selectedCity: cityId },
      });
    }
  };

const calculateShippingCost = useCallback(async () => {
  if (!state.selectedCity || !state.selectedProvince) return;

  const totalWeight = cartItems.reduce((total, item) => {
    // Check if the item has a variant and use the optionWeight from the selected variant if available
    const itemWeight = item.variant?.selectedOption?.optionWeight ?? item.productWeight ?? 0;
    return total + (itemWeight * item.quantity);
  }, 0);
  // Pastikan berat total tidak 0
  if (totalWeight === 0) {
    notifyError("Total weight cannot be zero");
    return;
  }

  try {
    dispatch({ type: actionTypes.SET_LOADING_COST, payload: true });
    const response = await apiCall(
      `${backendUrl}/api/rajaongkir/cost`,
      "POST",
      {
        origin: state.selectedProvince,
        destination: state.selectedCity,
        weight: totalWeight,  // Menggunakan total berat produk
        courier: "jne",
      },
      token
    );
    dispatch({ type: actionTypes.SET_COST, payload: response.data });
  } catch (error) {
    notifyError("Failed to calculate shipping cost.");
  } finally {
    dispatch({ type: actionTypes.SET_LOADING_COST, payload: false });
  }
}, [state.selectedProvince, state.selectedCity, cartItems, token, backendUrl]);


  // Trigger shipping cost calculation when city or province changes
  useEffect(() => {
    if (state.selectedCity) {
      calculateShippingCost();
    }
  }, [state.selectedCity, calculateShippingCost]);

  // Handle order submission (COD or Midtrans)
  const handleOrderSubmission = async (paymentMethod, orderData) => {
    try {
      if (!state.formData.address || !state.selectedProvince || !state.selectedCity) {
        notifyError("Please provide a complete address (address, province, and city).");
        return;
      }
  
      if (!cartItems.length) {
        notifyError("Your cart is empty");
        return;
      }
      if (!state.selectedService) {
        notifyError("Please select a shipping service");
        return;
      }
  
      let response;
      if (paymentMethod === "midtrans") {
        response = await apiCall(`${backendUrl}/api/order/midtrans`, "POST", orderData, token);
      } else if (paymentMethod === "cod") {
        response = await apiCall(`${backendUrl}/api/order/place`, "POST", orderData, token);
      }
  
      if (response && response.data.success) {
        globalDispatch({ type: actionTypes.CLEAR_CART }); // Kosongkan cart di context
        navigate("/orders");
        notifySuccess("Order placed successfully!");
      } else {
        notifyError("Failed to process your order. Please try again.");
      }
    } catch (error) {
      notifyError("Failed to place your order. Please try again.");
    }
  };

  return {
    state,
    dispatch,
    handleProvinceChange,
    handleCityChange,
    handleOrderSubmission,
  };
};

export default usePlaceOrder;
