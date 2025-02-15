// --- hooks/useCart.js ---
import { useCallback } from 'react';
import { toast } from 'react-toastify';
import { apiCall } from '../utils/apiCall';

export const useCart = (cartItems, updateQuantityFn, removeItemFromCartFn, clearCartFn) => {
  const handleQuantityChange = useCallback(async (productId, variantId, optionId, newQuantity) => {
    // Validasi kuantitas
    if (isNaN(newQuantity) || newQuantity < 1) {
        toast.warn("Invalid quantity."); // Use toast
        return;
    }
    try {
      const updatedCart = await updateQuantityFn(productId, variantId, optionId, newQuantity);
      if (updatedCart) {
          // Jika updateQuantityFn mengembalikan data keranjang yang baru,
          // asumsikan semuanya berhasil.  Tidak perlu menampilkan toast di sini
          // karena updateQuantityFn sendiri sudah menampilkannya.
      }

    } catch (error) {
        // updateQuantityFn sudah menampilkan toast, jadi kita tidak perlu melakukannya lagi
        //  toast.error("Error updating quantity."); // Redundant, already handled
    }
  }, [updateQuantityFn]); // Dependensi yang benar


    const handleRemoveItem = useCallback(async (productId, variantId, optionId) => {
        try {
            await removeItemFromCartFn(productId, variantId, optionId);
            // toast.success("Item removed from cart."); // Removed, handled in context
        } catch (error) {
            // toast.error("Error removing item from cart."); // Handled in context
        }
    }, [removeItemFromCartFn]);

    const handleClearCart = useCallback(async () => {
        try {
            await clearCartFn();
            // toast.success("Cart cleared."); // Removed, handled in context
        } catch (error) {
            // toast.error("Error clearing cart."); // Handled in context
        }
    }, [clearCartFn]);


    // Kalkulasi subtotal di sini.  Ini lebih efisien daripada menghitungnya di CartItem.
    const cartData = cartItems.map(item => {
        const product = item.productId;

        // Cek apakah product, variants, dan options ada sebelum mengakses propertinya
        const selectedVariant = product?.variants?.find(variant => variant._id.toString() === item.variantId?.toString());
        const selectedOption = selectedVariant?.options?.find(option => option._id.toString() === item.optionId?.toString());

        return {
            ...item,
            totalPrice: (selectedOption?.price ?? product?.price ?? 0) * item.quantity,
            productImage: product?.images?.[0] // Ambil gambar pertama, atau undefined
        };
    });

    return { cartData, handleQuantityChange, handleRemoveItem, handleClearCart };
};
