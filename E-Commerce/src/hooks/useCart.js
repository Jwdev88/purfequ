import { useReducer, useEffect, useCallback } from "react";
import { toast } from "react-toastify";

const actionTypes = {
  SET_CART_DATA: "SET_CART_DATA",
  ADD_TO_CART: "ADD_TO_CART",
  UPDATE_QUANTITY: "UPDATE_QUANTITY",
  REMOVE_ITEM: "REMOVE_ITEM",
  CLEAR_CART: "CLEAR_CART",
};
const formatCartItemData = (item) => {
  if (!item || !item.productId) {
    // console.error('Item is invalid or does not have productId:', item); // Log untuk debugging
    return null; // Abaikan item yang tidak valid
  }
  // console.log('Formatting item:', JSON.stringify(item)); // Log untuk debugging
  const itemPrice = parseFloat(item.variant?.selectedOption?.optionPrice ?? item.productPrice ?? 0); // Ambil harga item dari varian yang dipilih atau harga produk
  const itemQuantity = parseInt(item.quantity, 10) || 1; // Pastikan kuantitas item adalah angka
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
        toast.error("Kuantitas tidak valid.");
        return;
      }

      try {
        const updatedCartItems = await updateQuantity(productId, variantId, optionId, newQuantity);
        if (!updatedCartItems || !Array.isArray(updatedCartItems)) {
          throw new Error("Gagal memperbarui kuantitas."); // Tambahkan pengecekan validitas data
        }
        // console.log('Data keranjang yang diperbarui:', updatedCartItems); // Log untuk debugging
        const formattedCartData = updatedCartItems.map(formatCartItemData).filter(item => item !== null);
        dispatch({ type: actionTypes.SET_CART_DATA, payload: formattedCartData });
        toast.success("Kuantitas berhasil diperbarui.");
      } catch (error) {
        // console.error("Error memperbarui kuantitas:", error);
        toast.error("Gagal memperbarui kuantitas.");
      }
    },
    [updateQuantity]
  );

  const handleRemoveItem = useCallback(
    async (productId, variantId, optionId) => {
      try {
        await removeItemFromCart(productId, variantId, optionId);
        dispatch({ type: actionTypes.REMOVE_ITEM, payload: { productId, variantId, optionId } });
        toast.success("Item berhasil dihapus dari keranjang.", );
      } catch (error) {
        // console.error("Error menghapus item:", error);
        toast.error("Gagal menghapus item.");
      }
    },
    [removeItemFromCart]
  );


  const handleClearCart = useCallback(
    async () => {
      try {
        await clearCart();
        dispatch({ type: actionTypes.CLEAR_CART });
        toast.success("Keranjang berhasil dikosongkan.");
      } catch (error) {
        console.error("Error mengosongkan keranjang:", error);
        toast.error("Gagal mengosongkan keranjang.");
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
