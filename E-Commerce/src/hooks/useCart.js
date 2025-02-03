import { useReducer, useEffect, useCallback } from "react";
import { notifySuccess, notifyError,notifyWarningWithAction } from "../components/ToastNotification";



const actionTypes = {
  SET_CART_DATA: "SET_CART_DATA",
  ADD_TO_CART: "ADD_TO_CART",
  UPDATE_QUANTITY: "UPDATE_QUANTITY",
  REMOVE_ITEM: "REMOVE_ITEM",
  CLEAR_CART: "CLEAR_CART",
};const formatCartItemData = (item) => {
  if (!item || !item.productId) {
    return null; // Abaikan item yang tidak valid
  }

  const itemPrice = parseFloat(item.variant?.selectedOption?.optionPrice ?? item.productPrice ?? 0);
  const itemQuantity = parseInt(item.quantity, 10) || 1;
  
  // Mengambil berat dari varian jika ada, jika tidak ada maka gunakan berat default (misalnya 0)
  const itemWeight = item.variant?.selectedOption?.weight ?? 0;

  return {
    productId: item.productId,
    productName: item.productName || "Unknown Product",
    productImage: item.productImages?.[0] || "/default-image.png",
    productPrice: itemPrice,
    productCategory: item.productCategory || "No Category",
    productSubCategory: item.productSubCategory || "No Subcategory",
    variantId: item.variant?.variantId || null,
    variantName: item.variant?.variantName || "No Variant",
    optionId: item.variant?.selectedOption?.optionId || null,
    optionName: item.variant?.selectedOption?.optionName || "No Option",
    optionPrice: itemPrice,
    weight: itemWeight,  // Menambahkan berat pada format item
    quantity: itemQuantity,
    totalPrice: itemPrice * itemQuantity,
  };
};


const cartReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.SET_CART_DATA:
      return action.payload.filter(item => item !== null); // Abaikan item yang tidak valid
    case actionTypes.ADD_TO_CART:
      return [...state, action.payload];
    case actionTypes.UPDATE_QUANTITY:
      return state.map((item) =>
        item.productId === action.payload.productId &&
        item.variantId === action.payload.variantId &&
        item.optionId === action.payload.optionId
          ? { ...item, quantity: action.payload.newQuantity, totalPrice: item.optionPrice * action.payload.newQuantity }
          : item
      );
    case actionTypes.REMOVE_ITEM:
      return state.filter((item) =>
        item.productId !== action.payload.productId ||
        item.variantId !== action.payload.variantId ||
        item.optionId !== action.payload.optionId
      );
    case actionTypes.CLEAR_CART:
      return [];
    default:
      return state;
  }
};
export const useCart = (cartItems, updateQuantity, removeItemFromCart, clearCart) => {
  const [cartData, dispatch] = useReducer(cartReducer, []);
  
  useEffect(() => {
    if (cartItems?.length) {
  
      const formattedCartData = cartItems.map(formatCartItemData).filter(item => item !== null);
      dispatch({ type: actionTypes.SET_CART_DATA, payload: formattedCartData });
    }
  }, [cartItems]);

  const handleQuantityChange = useCallback(
    async (productId, variantId, optionId, newQuantity) => {
      if (!productId || newQuantity < 1) {
        notifyError("Kuantitas tidak valid.");
        return;
      }

      try {
        const updatedCartItems = await updateQuantity(productId, variantId, optionId, newQuantity);
        if (!updatedCartItems || !Array.isArray(updatedCartItems)) {
          throw new Error("Gagal memperbarui kuantitas."); // Tambahkan pengecekan validitas data
        }
        const formattedCartData = updatedCartItems.map(formatCartItemData).filter(item => item !== null);
        dispatch({ type: actionTypes.SET_CART_DATA, payload: formattedCartData });
        notifySuccess("Kuantitas berhasil diperbarui.");
      } catch (error) {
        notifyError("Gagal memperbarui kuantitas.");
      }
    },
    [updateQuantity]
  );

  const handleRemoveItem = useCallback(
    async (productId, variantId, optionId) => {
      try {
        await removeItemFromCart(productId, variantId, optionId);
        dispatch({ type: actionTypes.REMOVE_ITEM, payload: { productId, variantId, optionId } });
        notifySuccess("Item berhasil dihapus dari keranjang.", );
      } catch (error) {
        notifyError("Gagal menghapus item.");
      }
    },
    [removeItemFromCart]
  );


  const handleClearCart = useCallback(
    async () => {
      try {
        await clearCart();
        dispatch({ type: actionTypes.CLEAR_CART });
        notifySuccess("Keranjang berhasil dikosongkan.");
      } catch (error) {
        notifyError("Gagal mengosongkan keranjang.");
      }
    },
    [clearCart]
  );

  return {
    cartData,
    handleQuantityChange,
    handleRemoveItem,
    handleClearCart,
  };
};
