import { useReducer, useEffect, useCallback, useContext } from "react";
import { ShopContext } from "../context/ShopContext";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import { notifySuccess, notifyError,notifyWarningWithAction } from "../components/ToastNotification";

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
        selectedVariant: null,
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
  const { products, addToCart } = useContext(ShopContext);
  const [state, dispatch] = useReducer(reducer, initialState);
  const navigate = useNavigate(); // Inisialisasi useNavigate
  // Fetch product data
  useEffect(() => {
    if (!products.length) return;

    const product = products.find((item) => item._id === productId);
    if (product) {
      dispatch({ type: actionTypes.SET_PRODUCT_DATA, payload: product });
    } else {
      notifyError("Produk tidak ditemukan.");
      dispatch({ type: actionTypes.SET_LOADING, payload: false });
    }
  }, [productId, products]);

  // Handle variant change
  const handleVariantChange = useCallback((variantName, option, variantId) => {

    if (!option || option.stock <= 0) {
      notifyError("Varian tidak tersedia.");
      return;
    }

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
      dispatch({ type: actionTypes.SET_SELECTED_IMAGE, payload: option.image });
    }
  }, []);

  // Handle adding product to cart
  const handleAddToCart = useCallback(async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      notifyWarningWithAction({
        message: "Silakan login untuk menambahkan ke keranjang.",
        onConfirm: () => navigate("/login"),
      });
      return;
    }

    const hasVariants =
      state.productData.variants && state.productData.variants.length > 0;

    if (
      hasVariants &&
      (!state.selectedVariant || !state.selectedVariant.optionId)
    ) {
      notifyError("Harap pilih varian sebelum menambahkan ke keranjang.");
      return;
    }

    try {
      dispatch({ type: actionTypes.SET_ADDING_TO_CART, payload: true });
      const { _id: productId } = state.productData;
      const { variantId, optionId } = state.selectedVariant || {};
      await addToCart(productId, variantId, optionId, 1);
    } catch (error) {
    } finally {
      dispatch({ type: actionTypes.SET_ADDING_TO_CART, payload: false });
    }
  }, [state.productData, state.selectedVariant, addToCart]);

  return {
    state,
    handleVariantChange,
    handleAddToCart,
    dispatch,
  };
};
