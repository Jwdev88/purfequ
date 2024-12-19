import React, { createContext, useEffect, useState } from 'react';
import { FormatRupiah } from '@arismun/format-rupiah';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'
export const ShopContext = createContext();

const ShopContextProvider = (props) => {
    const formatIDR = (amount) => {
        return <FormatRupiah value={amount}
            decimalSeparator="," // Use comma as the decimal separator
            thousandSeparator="." // Use period as the thousand separator
        />;
    };
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    const [token, setToken] = useState('')
    const [search, setSearch] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const navigate = useNavigate();
    const [cartItems, setCartItems] = useState({});
    const [products, setProducts] = useState([])

    const [provinces, setProvinces] = useState([]);
    const [cities, setCities] = useState([]);
    const [selectedProvince, setSelectedProvince] = useState('');

    const [selectedCity, setSelectedCity] = useState('');
    const [weight, setWeight] = useState(1);
    const [courier, setCourier] = useState('jne');
    const [cost, setCost] = useState(null);

    useEffect(() => {
        const fetchProvinces = async () => {
            try {
                const response = await axios.get(backendUrl + '/api/rajaongkir/provinces', {

                });
                setProvinces(response.data.provinces);

            } catch (error) {
                console.error("Error fetching provinces:", error);
            }
        };

        fetchProvinces();
    }, []);

    const fetchCities = async (provinceId) => {
        try {
            const response = await axios.get(backendUrl + '/api/rajaongkir/cities/' + provinceId);
            setCities(response.data);
        } catch (error) {
            console.error("Error fetching cities:", error);
        }
    };
    const calculateCost = async (destination, weight, courier) => {
        try {
            const response = await axios.post(backendUrl +
                "/api/rajaongkir/cost",
                {
                    origin: 455, // ID Kota Tangerang (hardcoded di backend)
                    destination: destination,
                    weight: weight,
                    courier: courier,
                },
            );
            return response.data;
        } catch (error) {
            console.error("Error fetching cost:", error);
            return null;
        }
    };


    const addToCart = async (itemId, size) => {
        let cartData = structuredClone(cartItems)

        if (cartData[itemId]) {
            if (cartData[itemId][size]) {
                cartData[itemId][size] += 1;
            }
            else {
                cartData[itemId][size] = 1;

            }
        }
        else {
            cartData[itemId] = {};
            cartData[itemId][size] = 1;
        }
        setCartItems(cartData)

        if (token) {
            try {
                await axios.post(backendUrl + '/api/cart/add', { itemId, size }, { headers: { token } })
                toast.success('Item added to cart')
            } catch (error) {
                console.log(error)
                toast.error(error.message)
            }
        }
    }


    const getCartCount = () => {

        let totalCount = 0;

        for (const items in cartItems) {
            for (const item in cartItems[items]) {

                try {

                    if (cartItems[items][item] > 0) {
                        totalCount += cartItems[items][item];

                    }

                } catch (error) {
                }

            }

        }
        return totalCount;
    }


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

                }
            }
        }
        return totalAmount;
    }


    const getProductsData = async () => {
        try {
            const response = await axios.get(backendUrl + '/api/product/list');
            if (response.data.success) {
                const productsWithNumberPrice = response.data.products.map(product => {
                    const price = Number(product.price); // Convert to number here
                    if (isNaN(price)) {  // Check if the conversion resulted in NaN
                        console.error("Invalid price value for product:", product);
                        // Handle the error (e.g., set a default price, skip the product)
                        return { ...product, price: 0 }; // For example, set price to 0
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
    }, [])

    useEffect(() => {
        if (!token && localStorage.getItem('token')) {
            setToken(localStorage.getItem('token'))
            getUserCart(localStorage.getItem('token'))
        }
    }, [])


    const updateQuanity = async (itemId, size, quantity) => {
        let cartData = structuredClone(cartItems);

        cartData[itemId][size] = quantity;

        setCartItems(cartData)

        if (token) {
            try {
                await axios.post(backendUrl + '/api/cart/update', { itemId, size, quantity }, { headers: { token } })

            } catch (error) {
                console.log(error)
                toast.error(error.message)
            }
        }
    }

    const getUserCart = async (token) => {
        try {
            const response = await axios.post(backendUrl + '/api/cart/get', {}, { headers: { token } })
            if (response.data.success) {
                setCartItems(response.data.cartData)
            }
        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }
    // const increaseQuantity = (itemId, size) => {
    //     const currentQuantity = cartItems[itemId]?.[size] || 0;
    //     updateQuanity(itemId, size, currentQuantity + 1);
    // };

    // const decreaseQuantity = (itemId, size) => {
    //     const currentQuantity = cartItems[itemId]?.[size] || 0;
    //     if (currentQuantity > 1) {
    //         updateQuanity(itemId, size, currentQuantity - 1);
    //     } else if (currentQuantity === 1) {
    //         updateQuanity(itemId, size, 0); // Remove item if quantity is 1
    //     }
    // };

    const clearCart = (token) => {
        setCartItems({});
        if (token) {
            axios.post(backendUrl + '/api/cart/clear', {}, { headers: { token } })
                .then(response => {
                    if (response.data.success) {
                        toast.success('Cart cleared successfully');
                    } else {
                        console.error("Error clearing cart:", response.data.message);
                        toast.error(response.data.message || "Failed to clear cart."); // Tampilkan pesan error dari backend atau pesan default
                    }
                })
                .catch(error => {
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
        <ShopContext.Provider value={value}>
            {props.children}
        </ShopContext.Provider>
    );
}

export default ShopContextProvider;