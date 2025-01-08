import { useReducer, useCallback, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { actionTypes } from "../context/actionTypes";
import { apiCall } from "../context/ShopContext";

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
  },
  selectedService: null,
  method: "cod",
  isLoadingCost: false,
  cities: [],
  provinces: [],
};

const reducer = (state, action) => {
  switch (action.type) {
    case actionTypes.SET_SELECTED_PROVINCE:
      return { ...state, selectedProvince: action.payload };
    case actionTypes.SET_SELECTED_CITY:
      return { ...state, selectedCity: action.payload };
    case actionTypes.SET_COST:
      return { ...state, cost: action.payload };
    case actionTypes.SET_LOADING:
      return { ...state, isLoading: action.payload };
    case actionTypes.SET_FORM_DATA:
      return { ...state, formData: { ...state.formData, ...action.payload } };
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

const usePlaceOrder = (initialCartItems, backendUrl, token) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const navigate = useNavigate();

  const citiesCache = useMemo(() => new Map(), []);

  const fetchProvinces = useCallback(async () => {
    try {
      const response = await apiCall(`${backendUrl}/api/rajaongkir/provinces`);
      dispatch({ type: actionTypes.SET_PROVINCES, payload: response.data.provinces });
    } catch (error) {
      toast.error("Failed to fetch provinces.");
    }
  }, [backendUrl]);

  useEffect(() => {
    fetchProvinces();
  }, [fetchProvinces]);

  const fetchCities = useCallback(async (provinceId) => {
    if (citiesCache.has(provinceId)) {
      console.log("Menggunakan data kota dari cache.");
      dispatch({ type: actionTypes.SET_CITIES, payload: citiesCache.get(provinceId) });
      return;
    }

    console.log("Fetching cities for province:", provinceId);
    dispatch({ type: actionTypes.SET_LOADING, payload: true });
    try {
      const response = await apiCall(`${backendUrl}/api/rajaongkir/cities/${provinceId}`);
      console.log("Cities response:", response.data);

      const cities = response.data || [];
      console.log("Processed cities:", cities);
      
      citiesCache.set(provinceId, cities);
      dispatch({ type: actionTypes.SET_CITIES, payload: cities });
    } catch (error) {
      toast.error("Failed to fetch cities.");
      dispatch({ type: actionTypes.SET_CITIES, payload: [] });
    } finally {
      dispatch({ type: actionTypes.SET_LOADING, payload: false });
    }
  }, [backendUrl, citiesCache]);

  const handleProvinceChange = useCallback((provinceId) => {
    dispatch({ type: actionTypes.SET_SELECTED_PROVINCE, payload: provinceId });
    dispatch({
      type: actionTypes.SET_FORM_DATA,
      payload: { selectedProvince: provinceId },
    });
    fetchCities(provinceId);
    dispatch({ type: actionTypes.SET_SELECTED_CITY, payload: "" });
    dispatch({
      type: actionTypes.SET_FORM_DATA,
      payload: { selectedCity: "" },
    });
  }, [fetchCities]);

  const handleCityChange = (cityId) => {
    dispatch({ type: actionTypes.SET_SELECTED_CITY, payload: cityId });
    dispatch({
      type: actionTypes.SET_FORM_DATA,
      payload: { selectedCity: cityId },
    });
  };

  const calculateShippingCost = useCallback(async () => {
    dispatch({ type: actionTypes.SET_LOADING_COST, payload: true });
    try {
      const response = await apiCall(
        `${backendUrl}/api/rajaongkir/cost`,
        "POST",
        {
          origin: state.selectedProvince,
          destination: state.selectedCity,
          weight: 1,
          courier: "jne",
        },
        token
      );
      dispatch({ type: actionTypes.SET_COST, payload: response.data });
    } catch (error) {
      toast.error("Gagal menghitung biaya pengiriman.");
    } finally {
      dispatch({ type: actionTypes.SET_LOADING_COST, payload: false });
    }
  }, [state.selectedProvince, state.selectedCity, token, backendUrl]);

  useEffect(() => {
    if (state.selectedCity) {
      calculateShippingCost();
    }
  }, [state.selectedCity, calculateShippingCost]);

  const handleSubmit = async (orderItems, formData) => {
    try {
      const orderData = {
        address: formData,
        items: orderItems,
        amount:
          orderItems.reduce((total, item) => total + item.totalPrice, 0) +
          (state.selectedService ? state.selectedService.cost[0].value : 0),
        shippingService: state.selectedService,
      };

      let response;
      switch (state.method) {
        case "cod":
          response = await apiCall(
            `${backendUrl}/api/order/place`,
            "POST",
            orderData,
            token
          );
          if (response.data.success) {
            navigate("/orders");
            toast.success("Order placed successfully!");
          } else {
            toast.error(response.data.message);
          }
          break;

        case "midtrans":
          response = await apiCall(
            `${backendUrl}/api/order/midtrans`,
            "POST",
            orderData,
            token
          );
          if (response.data.success) {
            window.snap.pay(response.data.token, {
              onSuccess: () => {
                navigate("/orders");
                toast.success("Order placed successfully!");
              },
              onPending: (result) => console.log("Pending:", result),
              onError: (result) => {
                console.error("Error:", result);
                toast.error("Payment failed");
              },
              onClose: () => console.log("Closed"),
            });
          } else {
            toast.error(response.data.message);
          }
          break;

        default:
          break;
      }
    } catch (error) {
      console.error("Error placing order:", error);
      toast.error("Failed to place order");
    }
  };

  return {
    state,
    dispatch,
    handleProvinceChange,
    handleCityChange,
    calculateShippingCost,
    handleSubmit,
  };
};

export default usePlaceOrder;
