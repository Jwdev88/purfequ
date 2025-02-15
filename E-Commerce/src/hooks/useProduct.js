// hooks/useProduct.js
import { useReducer, useEffect, useCallback, useContext } from "react";
import { ShopContext } from "../context/ShopContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const initialState = {
    productData: null,
    selectedImage: "",
    selectedVariant: null,
    isLoading: true,
    isAddingToCart: false,
};

const actionTypes = {
    SET_PRODUCT_DATA: "SET_PRODUCT_DATA",
    SET_SELECTED_IMAGE: "SET_SELECTED_IMAGE",
    SET_SELECTED_VARIANT: "SET_SELECTED_VARIANT",
    SET_LOADING: "SET_LOADING",
    SET_ADDING_TO_CART: "SET_ADDING_TO_CART",
};

const reducer = (state, action) => {
    switch (action.type) {
        case actionTypes.SET_PRODUCT_DATA:
            return {
                ...state,
                productData: action.payload,
                selectedImage: action.payload.images?.[0] || "",
                selectedVariant: null, // Reset selected variant on new product data
                isLoading: false,
            };
        case actionTypes.SET_SELECTED_IMAGE:
            return { ...state, selectedImage: action.payload };
        case actionTypes.SET_SELECTED_VARIANT:
            return { ...state, selectedVariant: action.payload };
        case actionTypes.SET_LOADING:
            return { ...state, isLoading: action.payload };
        case actionTypes.SET_ADDING_TO_CART:
            return { ...state, isAddingToCart: action.payload };
        default:
            return state;
    }
};

export const useProduct = (productId) => {
  const { products, addToCart, fetchData, backendUrl, dispatch: shopDispatch, shopActionTypes } = useContext(ShopContext); // Destructure dispatch and actionTypes
    const [state, dispatch] = useReducer(reducer, initialState);
    const navigate = useNavigate();

  // --- Refetch product data (add this function) ---
  const refetchProductData = useCallback(async () => {
    try {
        await fetchData(
            `${backendUrl}/api/product/list`,  // Refetch ALL products
            shopActionTypes.SET_PRODUCTS, // Use the action type directly
            "Failed to fetch product data."
        );
    } catch (error) {
        // Error is already handled in fetchData
    }
}, [fetchData, backendUrl, shopActionTypes]);

    useEffect(() => {
        if (!products.length) return;

        const product = products.find((item) => item._id === productId);
        if (product) {
            dispatch({ type: actionTypes.SET_PRODUCT_DATA, payload: product });
        } else {
            toast.error("Produk tidak ditemukan");
            dispatch({ type: actionTypes.SET_LOADING, payload: false });
        }
    }, [productId, products]);

    // --- Polling (useEffect) ---
    useEffect(() => {
        const intervalId = setInterval(() => {
            refetchProductData(); // Re-fetch data every 5 seconds
        }, 5000); // 5000 milliseconds = 5 seconds

        // Cleanup function to clear the interval when the component unmounts
        return () => clearInterval(intervalId);
    }, [refetchProductData]); // Dependency on refetchProductData

    // --- Corrected handleVariantChange ---
    const handleVariantChange = useCallback((variantName, option, variantId) => {
      dispatch({
        type: actionTypes.SET_SELECTED_VARIANT,
        payload: {
          variantName,
          variantId: variantId || option.variantId,
          optionId: option._id,
          optionName: option.name,
          price: option.price,
          stock: option.stock,
        },
      });

      if (option.image) {
        dispatch({
          type: actionTypes.SET_SELECTED_IMAGE,
          payload: option.image,
        });
      }
    }, []);

  const handleAddToCart = useCallback(async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      toast.warn("Silakan login untuk menambahkan ke keranjang.", {
        onClose: () => navigate("/login"),
      });
      return;
    }

    const hasVariants =
      state.productData.variants && state.productData.variants.length > 0;

    if (
      hasVariants &&
      (!state.selectedVariant || !state.selectedVariant.optionId)
    ) {
      toast.error("Harap pilih varian sebelum menambahkan ke keranjang.");
      return;
    }

    let finalStockCheck = true;
    if (hasVariants) {
      const selectedOption = state.productData.variants
        .flatMap((variant) => variant.options)
        .find((option) => option._id === state.selectedVariant.optionId);

      if (!selectedOption || selectedOption.stock <= 0) {
        toast.error("Varian ini tidak tersedia.");
        finalStockCheck = false;
      }
    } else {
      if (state.productData.stock <= 0) {
        toast.error("Produk ini tidak tersedia.");
        finalStockCheck = false;
      }
    }

    if (!finalStockCheck) return;

    try {
      dispatch({ type: actionTypes.SET_ADDING_TO_CART, payload: true });
      const { _id: productId } = state.productData;
      const { variantId, optionId } = state.selectedVariant || {};
      await addToCart(productId, variantId, optionId, 1);
        await refetchProductData(); //REFETCH AFTER ADD TO CART
    } catch (error) {
      // Error handling is already done in ShopContext's addToCart
    } finally {
      dispatch({ type: actionTypes.SET_ADDING_TO_CART, payload: false });
    }
}, [state.productData, state.selectedVariant, addToCart, navigate, refetchProductData]); // Add refetchProductData


    return {
        state,
        handleVariantChange,
        handleAddToCart,
        dispatch,
    };
};