// --- hooks/usePlaceOrder.js ---
import { useReducer, useCallback, useEffect, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import { toast } from 'react-toastify';
import {apiCall} from '../utils/apiCall';

const initialState = {
    formData: {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        state: '',
        postalCode: '',
        province: '',
        city: '',
    },
    provinces: [],
    cities: [],
    isLoading: false,          // Only for the submit button
    isLoadingAddress: false,
    isLoadingCost: false,
    cost: null,
    selectedService: null,
    orderId: null, // Add orderId to the state
};

const reducer = (state, action) => {
    switch (action.type) {
        case 'SET_FORM_DATA':
            return { ...state, formData: { ...state.formData, ...action.payload } };
        case 'SET_PROVINCES':
            return { ...state, provinces: action.payload };
        case 'SET_CITIES':
            return { ...state, cities: action.payload };
        case 'SET_LOADING':
            return { ...state, isLoading: action.payload };
        case 'SET_LOADING_ADDRESS':
            return { ...state, isLoadingAddress: action.payload };
        case 'SET_LOADING_COST':
            return { ...state, isLoadingCost: action.payload };
        case 'SET_COST':
            return { ...state, cost: action.payload };
        case 'SET_SELECTED_SERVICE':
            return { ...state, selectedService: action.payload };
        case 'SET_SELECTED_PROVINCE':
            return {
                ...state,
                formData: { ...state.formData, province: action.payload, city: '' },
                cities: [], // Clear cities when province changes
            };
        case 'SET_SELECTED_CITY':
            return { ...state, formData: { ...state.formData, city: action.payload } };
        case 'SET_ORDER_ID':  // New action to set orderId
            return { ...state, orderId: action.payload };
        case 'RESET_FORM':
            return {
                ...initialState,
                provinces: state.provinces, // Keep provinces!
                isLoadingAddress: false,  // Ensure address loading is off
            };
        default:
            return state;
    }
};

const usePlaceOrder = () => {
    const [state, dispatch] = useReducer(reducer, initialState);
    const navigate = useNavigate();
    const { clearCart, backendUrl, token, cartItems } = useContext(ShopContext);

    const citiesCache = useMemo(() => new Map(), []);

    // --- Fetch Provinces ---
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
            throw new Error(
              response.data.message || "Failed to fetch provinces"
            );
          }
          dispatch({ type: "SET_PROVINCES", payload: response.data.provinces });
        } catch (error) {
          console.error(error);
          toast.error(error.message || "Failed to fetch provinces.");
        }
      };
      fetchProvinces();
    }, [backendUrl, token]);

    // --- Fetch Cities ---
    const fetchCities = useCallback(async (provinceId) => {
        if (!provinceId) {
            dispatch({ type: 'SET_CITIES', payload: [] });
            return;
        }

        if (citiesCache.has(provinceId)) {
            dispatch({ type: 'SET_CITIES', payload: citiesCache.get(provinceId) });
            return;
        }

        try {
            // No global loading state here.
            const response = await apiCall(`${backendUrl}/api/rajaongkir/cities/${provinceId}`, 'GET', {}, token);
            if (!response.data.success) {
                throw new Error(response.data.message || "Failed to fetch cities");
            }
            citiesCache.set(provinceId, response.data.cities);
            dispatch({ type: 'SET_CITIES', payload: response.data.cities });
        } catch (error) {
            console.error("Error fetching cities:", error);
            toast.error(error.message || "Failed to fetch cities.");
            dispatch({ type: 'SET_CITIES', payload: [] });
        }
    }, [backendUrl, token, citiesCache]);

    // --- Prefill Address ---
    useEffect(() => {
        const fetchUserAddresses = async () => {
            try {
                dispatch({ type: 'SET_LOADING_ADDRESS', payload: true });
                const response = await apiCall(`${backendUrl}/api/user/addresses`, 'GET', {}, token);
                if (!response.ok) {
                    throw new Error(response.data.message || "Failed to fetch addresses");
                }

                const addresses = response.data.addresses;
                if (addresses && addresses.length > 0) {
                    const defaultAddress = addresses[0];
                    dispatch({
                        type: 'SET_FORM_DATA',
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
                toast.error(error.message || 'Failed to fetch user address.');
            } finally {
                dispatch({ type: 'SET_LOADING_ADDRESS', payload: false });
            }
        };

        if (token) {
            fetchUserAddresses();
        }
    }, [backendUrl, token, fetchCities]);

    // --- Calculate Shipping Cost ---
    const calculateShippingCost = useCallback(async () => {
        if (!state.formData.city || state.cities.length === 0) {
            dispatch({ type: 'SET_COST', payload: null });
            return;
        }

        dispatch({ type: 'SET_LOADING_COST', payload: true });
        try {
            const payload = {
                origin: "501",  //  <<---  REPLACE WITH YOUR ORIGIN!
                destination: state.formData.city,
                weight: cartItems.reduce((acc, item) => acc + (item.variant?.selectedOption?.optionWeight ?? item.productWeight ?? 0) * item.quantity, 0),
                courier: "jne", // Consider making this dynamic
            };
            const response = await apiCall(`${backendUrl}/api/rajaongkir/cost`, "POST", payload, token);

            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to fetch shipping cost');
            }
            dispatch({ type: 'SET_COST', payload: response.data.costs });
        } catch (error) {
            console.error("Error fetching shipping cost:", error);
            toast.error(error.message);
            dispatch({ type: 'SET_COST', payload: null });
        } finally {
            dispatch({ type: 'SET_LOADING_COST', payload: false });
        }
    }, [backendUrl, cartItems, state.formData.city, state.cities.length, token]); // Correct dependencies

      // --- Trigger Shipping Cost Calculation (useEffect) ---
    useEffect(() => {
        if (state.formData.city && state.cities.length > 0) {
            calculateShippingCost();
        }
    }, [state.formData.city, state.cities.length, calculateShippingCost]);


      // --- Trigger fetchCities when province changes ---
      useEffect(() => {
        if(state.formData.province){
             fetchCities(state.formData.province)
        }

    }, [state.formData.province, fetchCities])

    // --- Handlers ---
    const handleProvinceChange = useCallback((provinceId) => {
        dispatch({ type: 'SET_SELECTED_PROVINCE', payload: provinceId });
    }, [dispatch]);

    const handleCityChange = useCallback((cityId) => {
        dispatch({ type: 'SET_SELECTED_CITY', payload: cityId });
    }, [dispatch]);

    const handleServiceSelect = useCallback((service) => {
        dispatch({ type: "SET_SELECTED_SERVICE", payload: service });
    }, [dispatch]);

   // --- Handle Order Submission (with Midtrans integration) ---
    const handleOrderSubmission = async (orderData) => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            const response = await apiCall(`${backendUrl}/api/order/midtrans`, "POST", orderData, token);

            if (!response.data.success) {
                throw new Error(response.data.message || "Failed to create order");
            }

            const { token: midtransToken, orderId, redirect_url } = response.data; // Get redirect_url

            if (!midtransToken || !orderId) {
                dispatch({ type: 'SET_LOADING', payload: false });
                toast.error("Failed to get payment token from Midtrans.");
                return;
            }

             // Store orderId in localStorage and state
              localStorage.setItem('orderId', orderId);
              dispatch({ type: 'SET_ORDER_ID', payload: orderId });


            // Use Snap.js for payment (if not using redirect)
            if (window.snap) {
                window.snap.pay(midtransToken, {
                    onSuccess: (result) => {
                        console.log("Midtrans success:", result);
                        toast.success("Payment successful!");
                        clearCart(); //  Only clear on success
                        localStorage.removeItem('orderId'); //remove order id
                        navigate('/orders');
                    },
                    onPending: (result) => {
                        console.log("Midtrans pending:", result);
                        toast.info("Payment pending. Please check your order status.");
                        localStorage.removeItem('orderId'); //remove order id
                        navigate('/orders'); // Go to orders, but don't clear the cart
                    },
                    onError: (result) => {
                        console.log("Midtrans error:", result);
                        dispatch({ type: 'SET_LOADING', payload: false }); // Stop loading
                        toast.error("Payment failed! Please try again.");
                        // Consider *not* clearing the cart here, so the user can retry.
                    },
                    onClose: () => {
                        console.log("Midtrans closed");
                        dispatch({ type: 'SET_LOADING', payload: false });// Stop loading
                        toast.warn("Payment window closed.");
                        // Redirect to orders page *and* pass the orderId
                        navigate(`/orders?orderId=${orderId}`);
                    },
                    options: {
                      requestTimeout: 30000, // Set timeout to 30 seconds (adjust as needed)
                     },
                });
            } else {
                // Fallback to redirect URL if Snap.js is not available
                window.location.href = redirect_url;
            }

        } catch (error) {
            console.error("Error creating order:", error);
            dispatch({ type: 'SET_LOADING', payload: false });
            toast.error(error.message || 'Failed to create order.');
        } finally {
             dispatch({type: 'RESET_FORM'}) //reset form
             dispatch({ type: 'SET_LOADING', payload: false }); // Ensure loading is off, even on error
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