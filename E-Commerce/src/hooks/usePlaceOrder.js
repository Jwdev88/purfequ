import { useReducer, useCallback } from "react";
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
    default:
      return state;
  }
};

const usePlaceOrder = (initialCartItems, backendUrl, token) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const navigate = useNavigate();

  const fetchCities = useCallback(async (provinceId) => {
    dispatch({ type: actionTypes.SET_LOADING, payload: true });
    try {
      const response = await apiCall(`${backendUrl}/api/rajaongkir/cities/${provinceId}`);
      dispatch({ type: actionTypes.SET_CITIES, payload: response.data.cities });
    } catch (error) {
      toast.error("Gagal mengambil data kota.");
    } finally {
      dispatch({ type: actionTypes.SET_LOADING, payload: false });
    }
  }, [backendUrl]);
  

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
      dispatch({ type: actionTypes.SET_COST, payload: response.data.costs });
    } catch (error) {
      toast.error("Gagal menghitung biaya pengiriman.");
    } finally {
      dispatch({ type: actionTypes.SET_LOADING_COST, payload: false });
    }
  }, [state.selectedProvince, state.selectedCity, token, backendUrl]);

  const handleProvinceChange = (provinceId) => {
    dispatch({ type: actionTypes.SET_SELECTED_PROVINCE, payload: provinceId });
    fetchCities(provinceId);
    dispatch({ type: actionTypes.SET_SELECTED_CITY, payload: "" });
  };

  const handleCityChange = (cityId) => {
    dispatch({ type: actionTypes.SET_SELECTED_CITY, payload: cityId });
  };

  const handleSubmit = async (orderItems, formData) => {
    try {
      const orderData = {
        address: formData,
        items: orderItems,
        amount: orderItems.reduce((total, item) => total + item.totalPrice, 0) + (state.selectedService ? state.selectedService.cost[0].value : 0),
        shippingService: state.selectedService,
      };

      let response;
      switch (state.method) {
        case "cod":
          response = await apiCall(`${backendUrl}/api/order/place`, "POST", orderData, token);
          if (response.data.success) {
            navigate("/orders");
            toast.success("Order placed successfully!");
          } else {
            toast.error(response.data.message);
          }
          break;

        case "midtrans":
          response = await apiCall(`${backendUrl}/api/order/midtrans`, "POST", orderData, token);
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
