import { useReducer, useEffect, useCallback } from "react";
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

export const useProduct = (products, productId, addToCart, formatIDR) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Fetch product data
  useEffect(() => {
    if (!products.length) return;

    const product = products.find((item) => item._id === productId);
    if (product) {
      dispatch({ type: actionTypes.SET_PRODUCT_DATA, payload: product });
    } else {
      dispatch({ type: actionTypes.SET_LOADING, payload: false });
    }
  }, [productId, products]);

  // Handle variant change
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
      dispatch({ type: actionTypes.SET_SELECTED_IMAGE, payload: option.image });
    }
  }, []);

  // Validate variant selection
  const validateVariantSelection = () => {
    const hasVariants = state.productData.variants && state.productData.variants.length > 0;
    const isVariantSelected = state.selectedVariant && state.selectedVariant.optionId;

    if (hasVariants && !isVariantSelected) {
      toast.error("Harap pilih opsi varian.");
      return false;
    }
    return true;
  };

  // Handle adding product to cart
  const handleAddToCart = async () => {
    if (!state.productData) return;

    const hasVariants = state.productData.variants && state.productData.variants.length > 0;

    if (hasVariants && !validateVariantSelection()) return;

    const { _id: productId } = state.productData;
    const { variantId, optionId } = state.selectedVariant || {};

    if (hasVariants && (!variantId || !optionId)) {
      toast.error("variantId dan optionId diperlukan untuk produk dengan varian.");
      return;
    }

    // console.log("Adding to cart with selected variant:", { variantId, optionId }); // Debugging log

    try {
      dispatch({ type: actionTypes.SET_ADDING_TO_CART, payload: true });
      await addToCart(productId, variantId, optionId, 1);
      toast.success("Produk berhasil ditambahkan ke keranjang!");
    } catch (error) {
      toast.error(error.message || "Gagal menambahkan produk ke keranjang.");
    } finally {
      dispatch({ type: actionTypes.SET_ADDING_TO_CART, payload: false });
    }
  };

  return {
    state,
    handleVariantChange,
    handleAddToCart,
  };
};
