import userModel from "../models/userModel.js";

// Mendapatkan cart berdasarkan userId
export const getUserCart = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await userModel.findById(userId).populate("cartData");

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const cartData = user.cartData;
    res.json({ success: true, cartData });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Menambahkan item ke cart

export const addToCart = async (userId, productId, variantId, quantity) => {
  try {
    const user = await userModel.findById(userId);

    // Periksa apakah varian produk ada dalam keranjang
    const existingItem = user.cartData.find(
      (item) =>
        item.productId.equals(productId) && item.variantId.equals(variantId)
    );
    // Improved check and update with optional chaining and default values
    cartData[itemId] = cartData[itemId] || {}; // Create empty object for itemId if not present
    cartData[itemId][variantName] = cartData[itemId][variantName] || {}; // Create empty object for variantName if not present

    cartData[itemId][variantName][variantOption] =
      (cartData[itemId][variantName][variantOption] || 0) + 1;
    if (existingItem) {
      existingItem.quantity += quantity; // Tambahkan jumlah ke item yang ada
    } else {
      user.cartData.push({ productId, variantId, quantity }); // Tambahkan item baru ke keranjang
    }
    await user.save();

    return user; // Kembalikan pengguna yang diperbarui
  } catch (error) {
    console.error(error);
    throw error; // Tangani kesalahan
  }
};

// Mengupdate quantity item di cart
export const updateCart = async (req, res) => {
  try {
    const { userId, productId, variantId, quantity } = req.body;
    const user = await userModel.findById(userId);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const item = user.cart.find(
      (item) =>
        item.productId.equals(productId) && item.variantId.equals(variantId)
    );

    if (item) {
      item.quantity = quantity;
    } else {
      return res
        .status(404)
        .json({ success: false, message: "Item not found in cart" });
    }

    await user.save();
    res.json({ success: true, message: "Cart updated successfully" });
  } catch (error) {
    console.error("Error updating cart:", error);
    res.status(500).json({ success: false, message: "Failed to update cart" });
  }
};
export const removeFromCart = async (userId, productId, variantId) => {
  try {
    const user = await userModel.findById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    user.cart = user.cart.filter(
      (item) =>
        !item.productId.equals(productId) || !item.variantId.equals(variantId)
    );

    await user.save();

    return user; // Return updated user
  } catch (error) {
    console.error("Error removing from cart:", error);
    throw error; // Handle error
  }
};

// Menghapus item di cart
export const clearCart = async (req, res) => {
  try {
    const userId = req.user._id; // Asumsikan Anda menggunakan middleware authentication

    await userModel.findByIdAndUpdate(userId, { cartData: {} });

    res.json({ success: true, message: "Cart cleared successfully" });
  } catch (error) {
    console.error("Error clearing cart:", error);
    res.status(500).json({ success: false, message: "Failed to clear cart" });
  }
};

export default {
  getUserCart,
  addToCart,
  updateCart,
  removeFromCart,
  // clearCart
};
