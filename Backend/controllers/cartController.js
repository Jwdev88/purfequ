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
    const { userId } = req.body;

    // Validate input
    const { error } = validateCartInput({ userId });
    if (error)
      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });

    const user = await userModel.findById(userId).populate("cartData");

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.json({ success: true, cartData: user.cartData });
  } catch (error) {
    handleError(res, error, "Failed to fetch user cart");
  }
};

// Add an item to the cart
export const addToCart = async (req, res) => {
  const { userId, productId, variantId, quantity } = req.body;
  console.log(req.body)
  if (!userId || !productId || !variantId || !quantity) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // Cari user berdasarkan userId
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Cek apakah item dengan productId dan variantId sudah ada di cart
    const existingItem = user.cartData.find(item => 
      item.productId.toString() === productId && item.variantId.toString() === variantId
    );

    if (existingItem) {
      // Jika item sudah ada, update quantity
      existingItem.quantity += quantity;
    } else {
      // Jika item belum ada, tambahkan item baru ke cartData
      user.cartData.push({ productId, variantId, quantity });
    }

    // Simpan perubahan ke database
    await user.save();
    await userModel.findByIdAndUpdate(userId, { cartData });
    // Response sukses
    res.status(200).json({ message: "Item added to cart", cartData: user.cartData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
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
export default {
  getUserCart,
  addToCart,
  updateCart,
  removeFromCart,
  clearCart,
};
