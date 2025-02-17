// --- hooks/useProduct.js ---
import { useReducer, useEffect, useCallback, useContext } from "react";
import { ShopContext } from "../context/ShopContext";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { apiCall } from "../utils/apiCall";

const initialState = {
  productData: null,
  selectedImage: "",
  selectedVariant: null,
  isLoading: true,
  isAddingToCart: false,
  error: null,
};

const actionTypes = {
  SET_PRODUCT_DATA: "SET_PRODUCT_DATA",
  SET_SELECTED_IMAGE: "SET_SELECTED_IMAGE",
  SET_SELECTED_VARIANT: "SET_SELECTED_VARIANT",
  SET_LOADING: "SET_LOADING",
  SET_ADDING_TO_CART: "SET_ADDING_TO_CART",
  SET_ERROR: "SET_ERROR",
};

const reducer = (state, action) => {
  switch (action.type) {
    case actionTypes.SET_PRODUCT_DATA:
      return {
        ...state,
        productData: action.payload,
        selectedImage: action.payload.images?.[0] || "",
        selectedVariant: null, // Reset selected variant
        isLoading: false,
        error: null,
      };
    case actionTypes.SET_SELECTED_IMAGE:
      return { ...state, selectedImage: action.payload };
    case actionTypes.SET_SELECTED_VARIANT:
      return { ...state, selectedVariant: action.payload };
    case actionTypes.SET_LOADING:
      return { ...state, isLoading: action.payload };
    case actionTypes.SET_ADDING_TO_CART:
      return { ...state, isAddingToCart: action.payload };
    case actionTypes.SET_ERROR:
      return { ...state, isLoading: false, error: action.payload };
    default:
      return state;
  }
};

export const useProduct = () => {
  const { addToCart, backendUrl, token, cartItems } = useContext(ShopContext); // Include cartItems
  const [state, dispatch] = useReducer(reducer, initialState);
  const navigate = useNavigate();
  const { productId } = useParams();

    // Early return if productId is missing.
    if (!productId) {
        return {
          state: {
            ...initialState,
            isLoading: false,
            error: "Product ID is missing",
          },
          handleVariantChange: () => {},
          handleAddToCart: () => {},
          dispatch,
            refetchProductData: () => {}, // Keep this, but it's a no-op

        };
      }

  // Stabilized fetchProduct with useCallback.  Dependencies should NOT change frequently.
  const fetchProduct = useCallback(async () => {
    dispatch({ type: actionTypes.SET_LOADING, payload: true });
    try {
      const response = await apiCall(
        `${backendUrl}/api/product/${productId}/get`,
        "GET",
        null,
        token
      );

      if (response.data.success) {
          const productData = response.data.product;

          // *** Initialize selectedVariant (if variants exist) ***
          let initialSelectedVariant = null;
          if (productData.variants && productData.variants.length > 0) {
            const firstVariant = productData.variants[0];
            if (firstVariant.options && firstVariant.options.length > 0) {
              const firstOption = firstVariant.options[0];
              initialSelectedVariant = {
                variantName: firstVariant.name,
                variantId: firstVariant._id,
                optionId: firstOption._id,
                optionName: firstOption.name,
                price: firstOption.price,
                stock: firstOption.stock,
              };
            }
          }

          dispatch({
            type: actionTypes.SET_PRODUCT_DATA,
            payload: productData,
          });

          // Set initial selected variant
          if(initialSelectedVariant) {
            dispatch({
                type: actionTypes.SET_SELECTED_VARIANT,
                payload: initialSelectedVariant
            })
          }

      } else {
        dispatch({
          type: actionTypes.SET_ERROR,
          payload: response.data.message || "Failed to fetch product.",
        });
        // toast.error(response.data.message || "Failed to fetch product.");
        navigate("/collection"); // Redirect if product not found
      }
    } catch (error) {
      // console.error("Error fetching product:", error);
      dispatch({
        type: actionTypes.SET_ERROR,
        payload: error.message || "Failed to fetch product.",
      });
      // toast.error(error.message || "Failed to fetch product.");
      navigate("/collection"); // Redirect on error
    } finally {
      dispatch({ type: actionTypes.SET_LOADING, payload: false });
    }
  }, [productId, backendUrl, token, navigate]); // Removed 'dispatch'

  useEffect(() => {
    if (productId && backendUrl) {
      fetchProduct();
    }
  }, [productId, backendUrl, fetchProduct]); // fetchProduct is now stable

  const handleVariantChange = useCallback(
    (variantName, option, variantId) => {
      dispatch({
        type: actionTypes.SET_SELECTED_VARIANT,
        payload: {
          variantName,
          variantId: variantId || option.variantId, // Use option.variantId if available
          optionId: option._id,
          optionName: option.name,
          price: option.price,
          stock: option.stock,
        },
      });

      if (option.image) {
        dispatch({ type: actionTypes.SET_SELECTED_IMAGE, payload: option.image });
      }
    },
    []
  );

  const handleAddToCart = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.warn("Please login to add to cart.", {
        onClose: () => navigate("/login"),
      });
      return;
    }

    const hasVariants =
      state.productData &&
      state.productData.variants &&
      state.productData.variants.length > 0;

    if (
      hasVariants &&
      (!state.selectedVariant || !state.selectedVariant.optionId)
    ) {
      toast.error("Please select a variant before adding to cart.");
      return;
    }

    try {
      dispatch({ type: actionTypes.SET_ADDING_TO_CART, payload: true });
      const { _id: productId } = state.productData || {}; // Use object destructuring with a default
      const { variantId, optionId } = state.selectedVariant || {};

      // Add to cart.  ShopContext handles quantity updates.
      await addToCart(productId, variantId, optionId, 1);
      // DO NOT re-fetch here.

    } catch (error) {
      console.error("addToCart failed", error);
      // Error handled by addToCart in context
    } finally {
      dispatch({ type: actionTypes.SET_ADDING_TO_CART, payload: false });
    }
}, [state.productData, state.selectedVariant, addToCart, navigate, dispatch]); // Removed fetchProduct


    return {
        state,
        handleVariantChange,
        handleAddToCart,
        dispatch,
        refetchProductData: fetchProduct
    };
};