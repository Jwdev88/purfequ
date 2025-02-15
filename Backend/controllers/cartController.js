// backend/controllers/cartController.js
import User from "../models/userModel.js";
import mongoose from "mongoose";
import product from "../models/productModel.js";

const populateCartData = (user) => {
  return user.cartData.map((item) => {
    const productItem = item.productId;  // This is now a FULL product object
    let selectedVariant = null;
    let selectedOption = null;

    if (productItem.variants && productItem.variants.length > 0 && item.variantId) {
        selectedVariant = productItem.variants.find(variant => variant._id.toString() === item.variantId.toString());

        if (selectedVariant && selectedVariant.options && selectedVariant.options.length > 0 && item.optionId) {
            selectedOption = selectedVariant.options.find(option => option._id.toString() === item.optionId.toString());
        }
    }

    return {
        productId: productItem._id.toString(),  // Use ._id.toString() -  VERY IMPORTANT
        productName: productItem.name,
        productDescription: productItem.description,
        productCategory: productItem.category ? productItem.category.name : "No Category", // Access category.name
        productSubCategory: productItem.subCategory ? productItem.subCategory.name : "No Subcategory", // Access subCategory.name
        productImages: productItem.images,
        productPrice: productItem.price,  // This is correct for the MAIN product
        productStock: productItem.stock,  // This is correct for the MAIN product
        productSku: productItem.sku,      // This is correct for the MAIN product
        productWeight: productItem.weight, // Correct for main product
        productBestSeller: productItem.bestSeller,
        quantity: item.quantity,
        variant: selectedVariant ? {
            variantId: selectedVariant._id.toString(), // Use ._id.toString()
            variantName: selectedVariant.name,
            selectedOption: selectedOption ? {
                optionId: selectedOption._id.toString(), // Use ._id.toString()
                optionName: selectedOption.name,
                optionPrice: selectedOption.price,
                optionStock: selectedOption.stock,
                optionSku: selectedOption.sku,
                optionWeight: selectedOption.weight,
            } : null,
        } : null,
        totalPrice: (selectedOption?.price ?? productItem.price ?? 0) * item.quantity, // Correct price calculation
        productImage: productItem.images?.[0]
    };
});
};

// ... (rest of your cartController.js -  getUserCart, addToCart, updateCart, clearCart - remain as in the PREVIOUS response)

export const getUserCart = async (req, res) => {
    try {
        const userId = req.user._id || req.params.userId || req.query.userId;
        console.log("userId:", userId); // Debug log

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ success: false, message: "Invalid userId" });
        }

        const user = await User.findById(userId).select('cartData');
          console.log("user", user) // Debug log
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const populatedUser = await user.populateCart();
        console.log("populatedUser", populatedUser) // Debug log

        const mappedCartData = populateCartData(populatedUser);
         console.log("mappedCartData", mappedCartData) // Debug log
        res.status(200).json({
            success: true,
            cartData: mappedCartData,  // Send the MAPPED data
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
      return res
        .status(400)
        .json({ success: false, message: "User not authenticated" });
    }
      console.log("req.user", req.user)
    const fetchedProduct = await product.findById(productId);
    if (!fetchedProduct) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // Find existing item *using .equals() for ObjectId comparison*
    const existingCartItem = req.user.cartData.find(
      (item) =>
        item.productId.equals(productId) &&
        (!variantId || item.variantId?.equals(variantId)) && // Use .equals()
        (!optionId || item.optionId?.equals(optionId))     // Use .equals()
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
            message:
              "variantId and optionId are required for products with variants",
          });
        }
        cartItem.variantId = variantId;
        cartItem.optionId = optionId;
      }

      req.user.cartData.push(cartItem);
    }

      await req.user.save();
      const populatedUser = await req.user.populateCart(); // Populate
      const mappedCartData = populateCartData(populatedUser); // Map

    return res.status(200).json({
      success: true,
      message: "Item added to cart",
        cartData: mappedCartData, // Send the MAPPED data
    });
  } catch (error) {
    console.error("Error adding to cart:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to add item to cart" });
  }
};

export const updateCart = async (req, res) => {
    try {
        const userId = req.user?._id || req.params.userId || req.query.userId;
        const { productId, variantId, optionId, quantity } = req.body;
        console.log("Received update request:", req.body);

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

         // Find existing item *using .equals() for ObjectId comparison*
        const existingCartItem = user.cartData.find((item) =>
            item.productId.equals(productId) &&
            (!variantId || item.variantId?.equals(variantId)) && // Use .equals()
            (!optionId || item.optionId?.equals(optionId))       // Use .equals()
        );

        if (existingCartItem) {
            if (quantity === 0) {
                // Remove the item from the cartData array
                user.cartData = user.cartData.filter((item) => item !== existingCartItem);
            } else {
                // Update the quantity
                existingCartItem.quantity = quantity;
            }
        } else {

            if (quantity > 0) {
                user.cartData.push({
                    productId,
                    variantId: variantId || null,  // Explicitly set to null if not provided
                    optionId: optionId || null,    // Explicitly set to null if not provided
                    quantity,
                });
            } else {
              //If not exist cart item and quantity 0
              return res.status(400).json({
                success: false,
                message: "Cannot add an item with quantity 0 if not exists",
              });
            }

        }

        await user.save();
        const populatedUser = await user.populateCart();  // *** POPULATE ***
        const mappedCartData = populateCartData(populatedUser); // *** MAP ***
        console.log("mappedCartData update:", mappedCartData);

        res.status(200).json({
            success: true,
            message: "Cart updated successfully",
            cartItems: mappedCartData, // *** SEND MAPPED DATA ***
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

        user.cartData = []; // Just clear the array.
        await user.save();

        res.status(200).json({
            success: true,
            message: "Cart cleared successfully",
            cart: user.cartData, // Return the empty cart
        });
    } catch (error) {
      console.error("Failed to clear cart", error); // Use console.error
      res.status(500).json({ success: false, message: "Failed to clear cart", error:error.message }); // Kirim pesan error yang lebih baik
    }
};

// backend/controllers/cartController.js

// ... (existing code) ...
export const removeItemsFromCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { itemIds } = req.body; // Expect an array of item IDs

    if (!userId || !itemIds || !Array.isArray(itemIds)) {
      return res.status(400).json({ success: false, message: "Invalid request data." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    // Filter out the items to be removed
    user.cartData = user.cartData.filter(item => {
      const itemKey = `${item.productId.toString()}-${item.variantId?.toString() || 'no-variant'}-${item.optionId?.toString() || 'no-option'}`;
      return !itemIds.includes(itemKey); // Keep items that are NOT in itemIds
    });

    await user.save();          // Save the user
    const populatedUser = await user.populateCart(); // Populate
    const mappedCartData = populateCartData(populatedUser);   // Map

    res.status(200).json({
      success: true,
      message: "Items removed from cart.",
      cartItems: mappedCartData,  // Return UPDATED cart
    });

  } catch (error) {
    console.error("Error removing items from cart:", error);
    res.status(500).json({ success: false, message: "Failed to remove items from cart.", error: error.message });
  }
};

