import userModel from "../models/userModel.js";
import Joi from "joi";
import mongoose from "mongoose";
// Helper function for standardized error responses
const handleError = (
  res,
  error,
  message = "An error occurred",
  status = 500
) => {
  console.error(message, error);
  res.status(status).json({ success: false, message });
};

// Validation schema using Joi
const validateCartInput = (data, requireVariant = false) => {
  const schema = Joi.object({
    userId: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required(), // Validasi MongoDB ObjectId
    productId: Joi.string().optional(),
    variantId: requireVariant
      ? Joi.string().required()
      : Joi.string().optional(),
    quantity: Joi.number().integer().min(1).optional(),
  });
  return schema.validate(data);
};

// Get user's cart by userId
export const getUserCart = async (req, res) => {
  try {
    // Extract user ID from the token
    const { userId } = req.query;
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Authorization token missing" });
    }

    // // Verify token
    // const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // const userId = decoded.id;

    // Fetch user and cart data
    const user = await userModel.findById(userId).populate("cartData.productId");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Return cart data
    res.status(200)
    json({ success: true, cartData: user.cartData });
  } catch (error) {
    console.error("Error fetching user cart:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch user cart" });
  }
};


// Add an item to the cart
export const addToCart = async (req, res) => {
  try {
    const { productId, variantId, quantity } = req.body;

    // Ambil userId dari token yang sudah divalidasi oleh middleware
    const userId = req.userId;

    console.log("addToCart request:", { userId, productId, variantId, quantity });

    // Validasi input
    if (!userId) {
      return res.status(401).json({ message: "User tidak terautentikasi" });
    }

    if (!productId || !variantId || !quantity || quantity < 1) {
      return res.status(400).json({
        message: "Invalid input. Semua field harus diisi dan quantity minimal 1.",
      });
    }

    if (!Array.isArray(variantId) || variantId.length === 0) {
      return res
        .status(400)
        .json({ message: "Variant ID harus berupa array dan tidak boleh kosong." });
    }

    // Pastikan setiap varian memiliki pasangan optionId
    const isValidVariants = variantId.every(
      (v) => v.variantId && v.optionId
    );

    if (!isValidVariants) {
      return res.status(400).json({
        message: "Setiap varian harus memiliki pasangan variantId dan optionId.",
      });
    }

    // Ambil data user
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User tidak ditemukan." });
    }

    // Cari apakah item sudah ada di keranjang
    const existingCartItem = user.cartData.find(
      (item) =>
        item.productId.toString() === productId &&
        item.variants.length === variantId.length &&
        item.variants.every((v, idx) =>
          v.variantId.toString() === variantId[idx].variantId &&
          v.optionId.toString() === variantId[idx].optionId
        )
    );

    if (existingCartItem) {
      // Jika item sudah ada di keranjang, tambahkan quantity
      existingCartItem.quantity += quantity;
    } else {
      // Jika item belum ada di keranjang, tambahkan sebagai entri baru
      user.cartData.push({ productId, variants: variantId, quantity });
    }

    // Simpan perubahan ke database
    await user.save();

    res.status(200).json({
      message: "Item berhasil ditambahkan ke keranjang",
      success: true,
      cart: user.cartData,
    });
  } catch (error) {
    console.error("Error in addToCart:", error);
    
    res.status(500).json({success: false, message: "Terjadi kesalahan server", });
  }
};




// Update quantity of a cart item
export const updateCart = async (req, res) => {
  try {
    const { userId, productId, variantId, quantity } = req.body;

    // Validate input
    const { error } = validateCartInput(
      { userId, productId, variantId, quantity },
      true
    );
    if (error)
      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });

    const user = await userModel.findById(userId);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const item = user.cartData.find(
      (item) =>
        item.productId.equals(productId) && item.variantId.equals(variantId)
    );

    if (!item) {
      return res
        .status(404)
        .json({ success: false, message: "Item not found in cart" });
    }

    item.quantity = quantity; // Update quantity
    await user.save();

    res.json({
      success: true,
      message: "Cart updated successfully",
      cartData: user.cartData,
    });
  } catch (error) {
    handleError(res, error, "Failed to update cart");
  }
};

// Remove an item from the cart
export const removeFromCart = async (req, res) => {
  try {
    const { userId, productId, variantId } = req.body;

    // Validate input
    const { error } = validateCartInput({ userId, productId, variantId }, true);
    if (error)
      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });

    const user = await userModel.findById(userId);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Filter out the item to be removed
    user.cartData = user.cartData.filter(
      (item) =>
        !(item.productId.equals(productId) && item.variantId.equals(variantId))
    );

    await user.save();
    res.json({
      success: true,
      message: "Item removed from cart",
      cartData: user.cartData,
    });
  } catch (error) {
    handleError(res, error, "Failed to remove item from cart");
  }
};

// Clear the user's cart
export const clearCart = async (req, res) => {
  try {
    const { userId } = req.body;

    // Validate input
    const { error } = validateCartInput({ userId });
    if (error)
      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });

    const user = await userModel.findByIdAndUpdate(
      userId,
      { cartData: [] },
      { new: true }
    );

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      message: "Cart cleared successfully",
      cartData: user.cartData,
    });
  } catch (error) {
    handleError(res, error, "Failed to clear cart");
  }
};

// Export all handlers
