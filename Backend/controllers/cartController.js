import User from "../models/userModel.js";
import mongoose from "mongoose";
import product from "../models/productModel.js";
const populateCartData = (user) => {
  return user.cartData.map(item => {
    const product = item.productId;
    let selectedVariant = null;
    let selectedOption = null;

    if (product.variants && product.variants.length > 0 && item.variantId) {
      selectedVariant = product.variants.find(variant => variant._id.toString() === item.variantId.toString());

      if (selectedVariant && selectedVariant.options && selectedVariant.options.length > 0 && item.optionId) {
        selectedOption = selectedVariant.options.find(option => option._id.toString() === item.optionId.toString());
      }
    }

    return {
      productId: product._id,
      productName: product.name,
      productDescription: product.description,
      productCategory: product.category ? product.category.name : null,
      productSubCategory: product.subCategory ? product.subCategory.name : null,
      productImages: product.images,
      productPrice: product.price,
      productStock: product.stock,
      productBestSeller: product.bestSeller,
      quantity: item.quantity,
      variant: selectedVariant ? {
        variantId: selectedVariant._id,
        variantName: selectedVariant.name,
        selectedOption: selectedOption ? {
          optionId: selectedOption._id,
          optionName: selectedOption.name,
          optionPrice: selectedOption.price,
          optionStock: selectedOption.stock,
          optionSku: selectedOption.sku,
          optionWeight: selectedOption.weight,
        } : null,
      } : null,
    };
  });
};

export const getUserCart = async (req, res) => {
  try {
    const userId = req.user._id || req.params.userId || req.query.userId;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: "Invalid userId" });
    }

    const user = await User.findById(userId).select('cartData');

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const populatedUser = await user.populateCart();
    const mappedCartData = populateCartData(populatedUser);

    res.status(200).json({
      success: true,
      cartData: mappedCartData,
    });
  } catch (error) {
    console.error("Error fetching cart data:", error);
    res.status(500).json({ success: false, message: "Failed to fetch user cart" });
  }
};


export const addToCart = async (req, res) => {
  try {
    const { productId, variantId, optionId, quantity = 1 } = req.body;

    if (!req.user) {
      return res.status(400).json({ success: false, message: "User not authenticated" });
    }

    const fetchedProduct = await product.findById(productId).populate('variants.options.optionId');
    
    if (!fetchedProduct) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const existingCartItem = req.user.cartData.find(item => 
      item.productId.equals(productId) &&
      (!variantId || item.variantId?.equals(variantId)) &&
      (!optionId || item.optionId?.equals(optionId))
    );

    if (existingCartItem) {
      existingCartItem.quantity += quantity;
    } else {
      const cartItem = {
        productId,
        quantity,
      };

      if (fetchedProduct.variants && fetchedProduct.variants.length > 0) {
        if (!variantId || !optionId) {
          return res.status(400).json({
            success: false,
            message: "variantId and optionId are required for products with variants",
          });
        }
        cartItem.variantId = variantId;
        cartItem.optionId = optionId;
      }

      req.user.cartData.push(cartItem);
    }

    await req.user.save();
    const populatedUser = await req.user.populateCart();
    const mappedCartData = populateCartData(populatedUser);

    return res.status(200).json({
      success: true,
      message: "Item added to cart",
      cartData: mappedCartData, // Kembalikan data keranjang yang sudah dipopulasi
    });
  } catch (error) {
    console.error("Error adding to cart:", error);
    res.status(500).json({ success: false, message: "Failed to add item to cart" });
  }
};

export const updateCart = async (req, res) => {
  try {
    const userId = req.user?._id || req.params.userId || req.query.userId;
    const { productId, variantId, optionId, quantity } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid userId or productId",
      });
    }

    if (quantity == null || quantity < 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a non-negative number",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const existingCartItem = user.cartData.find((item) => 
      item.productId.toString() === productId &&
      (!variantId || item.variantId?.toString() === variantId) &&
      (!optionId || item.optionId?.toString() === optionId)
    );

    if (existingCartItem) {
      if (quantity === 0) {
        user.cartData = user.cartData.filter((item) => item !== existingCartItem);
      } else {
        existingCartItem.quantity = quantity;
      }
    } else {
      if (quantity > 0) {
        user.cartData.push({
          productId,
          variantId: variantId || null,
          optionId: optionId || null,
          quantity,
        });
      } else {
        return res.status(400).json({
          success: false,
          message: "Cannot add an item with quantity 0",
        });
      }
    }

    await user.save();
    const populatedUser = await user.populateCart();
    const mappedCartData = populateCartData(populatedUser);

    res.status(200).json({
      success: true,
      message: "Cart updated successfully",
      cartItems: mappedCartData, // Kembalikan data keranjang yang sudah dipopulasi
    });
  } catch (error) {
    console.error("Error updating cart:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating cart",
      error: error.message,
    });
  }
};


// Clear user's cart
export const clearCart = async (req, res) => {
  try {
    const userId = req.user._id || req.params.userId || req.query.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    user.cartData = [];
    await user.save();

    res.status(200).json({
      success: true,
      message: "Cart cleared successfully",
      cart: user.cartData,
    });
  } catch (error) {
    handleError(res, error, "Failed to clear cart");
  }
};
