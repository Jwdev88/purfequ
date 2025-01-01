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
      .required(), // Validate MongoDB ObjectId
    productId: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required(),
    variantId: requireVariant
      ? Joi.array()
          .items(
            Joi.object({
              variantId: Joi.string()
                .regex(/^[0-9a-fA-F]{24}$/)
                .required(),
              optionId: Joi.string()
                .regex(/^[0-9a-fA-F]{24}$/)
                .required(),
            })
          )
          .required()
      : Joi.array().optional(),
    quantity: Joi.number().integer().min(1).optional(),
  });
  return schema.validate(data);
};

// Fetch user cart
export const getUserCart = async (req, res) => {
  try {
    const userId = req.params.userId || req.body.userId || req.userId;

    // Log untuk memastikan sumber userId
    console.log("Request Params:", req.params);
    console.log("Request Body:", req.body);
    console.log("Request Headers:", req.headers);
    // Validasi format ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid userId format" });
    }
    // Validasi apakah userId ada
    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "UserId is required" });
    }
    // Ambil data user beserta data produk dan varian yang dirujuk di keranjang
    const user = await userModel.findById(userId).populate({
      path: "cartData.productId", // Populate produk di keranjang
      model: "product", // Pastikan sesuai dengan nama model `Product`
      populate: {
        path: "variants.options", // Populate opsi varian jika diperlukan
      },
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, cartData: user.cartData });
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
    const userId = req.userId;
    const { productId, variantId, quantity } = req.body;

    const { error } = validateCartInput(
      { userId, productId, variantId, quantity },
      true
    );
    if (error)
      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });

    const user = await userModel.findById(userId);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    // Check if item exists in cart
    const existingCartItem = user.cartData.find(
      (item) =>
        item.productId.toString() === productId &&
        item.variants.length === variantId.length &&
        item.variants.every(
          (v, idx) =>
            v.variantId.toString() === variantId[idx].variantId &&
            v.optionId.toString() === variantId[idx].optionId
        )
    );

    if (existingCartItem) {
      existingCartItem.quantity += quantity; // Update quantity
    } else {
      user.cartData.push({ productId, variants: variantId, quantity }); // Add new item
    }

    await user.save();
    res.status(200).json({
      success: true,
      message: "Item added to cart",
      cart: user.cartData,
    });
  } catch (error) {
    handleError(res, error, "Failed to add item to cart");
  }
};

// Update cart item quantity

export const updateCart = async (req, res) => {
  try {
    const { productId, variantId, quantity } = req.body;
    const userId = req.userId; // Assuming userId is set in the request

    // Ensure variantId is an array of objects, and each object has "variantId" and "optionId"
    if (
      !Array.isArray(variantId) ||
      !variantId.every((v) => v.variantId && v.optionId)
    ) {
      return res.status(400).json({
        success: false,
        message:
          '"variantId" must be an array of objects with both "variantId" and "optionId" fields',
      });
    }

    // Validate input
    if (!productId || !variantId || quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: '"productId", "variantId", and "quantity" are required',
      });
    }

    // Find the user
    const user = await userModel.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Find the matching cart item
    const itemIndex = user.cartData.findIndex(
      (item) =>
        item.productId.toString() === productId &&
        item.variants.some(
          (variant) =>
            variant.variantId.toString() === variantId[0].variantId &&
            variant.optionId.toString() === variantId[0].optionId
        )
    );

    if (itemIndex === -1) {
      return res
        .status(404)
        .json({ success: false, message: "Item not found in cart" });
    }

    // Update the quantity
    user.cartData[itemIndex].quantity = quantity;

    // Save the updated cart
    await user.save();

    // Send the updated cart data in the response
    res.status(200).json({
      success: true,
      message: "Cart updated successfully",
      cart: user.cartData, // Return the updated cart data
    });
  } catch (error) {
    console.error("Error updating cart:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update cart",
    });
  }
};

// Remove an item from the cart
export const removeFromCart = async (req, res) => {
  try {
    const { productId, variantId } = req.body;
    const userId = req.userId;

    const { error } = validateCartInput({ userId, productId, variantId }, true);
    if (error)
      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });

    const user = await userModel.findById(userId);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    user.cartData = user.cartData.filter(
      (item) =>
        !(
          item.productId.toString() === productId &&
          item.variants.every(
            (v, idx) =>
              v.variantId.toString() === variantId[idx].variantId &&
              v.optionId.toString() === variantId[idx].optionId
          )
        )
    );

    await user.save();
    res.status(200).json({
      success: true,
      message: "Item removed from cart",
      cart: user.cartData,
    });
  } catch (error) {
    handleError(res, error, "Failed to remove item from cart");
  }
};

// Clear user's cart
export const clearCart = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await userModel.findByIdAndUpdate(
      userId,
      { cartData: [] },
      { new: true }
    );

    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    res.status(200).json({
      success: true,
      message: "Cart cleared successfully",
      cart: user.cartData,
    });
  } catch (error) {
    handleError(res, error, "Failed to clear cart");
  }
};
