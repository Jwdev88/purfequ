import { v2 as cloudinary } from "cloudinary";
import Product from "../models/productModel.js";
import mongoose from "mongoose";
//create sukses
const addProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      stock,
      weight,
      category,
      subCategory,
      variants,
      bestSeller,
      sku,
    } = req.body;

    console.log("req.body", req.body);

    // Handle image uploads
    const image1 = req.files?.image1?.[0];
    const image2 = req.files?.image2?.[0];
    const image3 = req.files?.image3?.[0];
    const image4 = req.files?.image4?.[0];

    const images = [image1, image2, image3, image4].filter(Boolean);

    const imagesURI = await Promise.all(
      images.map(async (item) => {
        let result = await cloudinary.uploader.upload(item.path, {
          resource_type: "image",
        });
        return result.secure_url;
      })
    );

    // Parse variants data
    let parsedVariants;
    try {
      parsedVariants =
        typeof variants === "string" ? JSON.parse(variants) : variants;

      // Validate variants structure
      if (!Array.isArray(parsedVariants)) {
        throw new Error("Variants must be an array");
      }

      // Ensure at least one variant exists
      if (parsedVariants.length === 0) {
        throw new Error("At least one variant is required");
      }

      // Validate each variant and its options
      parsedVariants.forEach((variant, index) => {
        if (!variant.name || !Array.isArray(variant.options)) {
          throw new Error(`Invalid variant structure at index ${index}`);
        }

        variant.options.forEach((option, optIndex) => {
          // Convert stock, price, and weight to numbers
          option.stock = Number(option.stock);
          option.price = Number(option.price);
          option.weight = Number(option.weight);

          if (!option.name || isNaN(option.stock)) {
            throw new Error(
              `Invalid option structure in variant ${index}, option ${optIndex}`
            );
          }
        });
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: `Invalid variants data: ${error.message}`,
      });
    }

    const productData = {
      name,
      description,
      category,
      price: Number(price),
      stock: Number(stock),
      weight: Number(weight),
      subCategory,
      bestSeller: bestSeller === "true",
      images: imagesURI,
      sku,
      variants: parsedVariants.map((variant) => ({
        name: variant.name,
        options: variant.options.map((option) => ({
          name: option.name,
          stock: Number(option.stock),
          price: Number(option.price),
          sku: option.sku,
          weight: Number(option.weight),
        })),
      })),
    };

    try {
      const product = new Product(productData);

      await product.save();

      res.status(201).json({
        success: true,
        message: "Produk berhasil ditambahkan",
      });
    } catch (error) {
      if (error.code === 11000) {
        console.log("Duplicate key error:", error);
        if (error.keyPattern.sku) {
          return res.status(400).json({
            success: false,
            message: "SKU produk sudah terdaftar.",
          });
        } else if (error.keyPattern["variants.options.sku"]) {
          return res.status(400).json({
            success: false,
            message: "SKU varian sudah terdaftar.",
          });
        }
      }

      if (error.errors?.sku) {
        return res.status(400).json({
          success: false,
          message: error.errors.sku.message,
        });
      }

      console.error("Error creating product:", error);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan server.",
      });
    }
  } catch (error) {
    console.error("Error in product creation:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server.",
    });
  }
};
 
const getProducts = async (req, res) => {
  try {
    const products = await Product.find({})
      .populate("category subCategory")
      .populate("variants.options");

    res.status(200).json({ success: true, products });
  } catch (error) {
    console.error("Error retrieving products:", error);
    res.status(500).json({ success: false, message: "Failed to load product data" });
  }
};
const getProductById = async (req, res) => {
  try {
    const { Id } = req.params;
    if (!Id || !mongoose.Types.ObjectId.isValid(Id)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    const product = await Product.findById(Id)
      .populate("category subCategory")
      .populate("variants.options");

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.json({ success: true, product });
  } catch (error) {
    console.error("Error retrieving product:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.body;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    const deletedProduct = await Product.findByIdAndDelete(id);
    if (!deletedProduct) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.status(200).json({ success: true, message: "Product successfully deleted" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const editProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const {
      name,
      description,
      category,
      subCategory,
      bestSeller,
      price,
      weight,
      stock,
      sku,
      variants,
    } = req.body;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: "Invalid productId" });
    }

    // Parse and validate variants
    let parsedVariants;
    try {
      parsedVariants = typeof variants === "string" ? JSON.parse(variants) : variants;
      if (!Array.isArray(parsedVariants) || parsedVariants.length === 0) {
        throw new Error("Variants must be a non-empty array");
      }
      parsedVariants.forEach((variant, index) => {
        if (!variant.name || !Array.isArray(variant.options)) {
          throw new Error(`Invalid variant structure at index ${index}`);
        }
        variant.options.forEach((option, optIndex) => {
          option.stock = Number(option.stock);
          option.price = Number(option.price);
          option.weight = Number(option.weight);
          if (!option.name || isNaN(option.stock)) {
            throw new Error(`Invalid option structure in variant ${index}, option ${optIndex}`);
          }
        });
      });
    } catch (error) {
      return res.status(400).json({ success: false, message: `Invalid variants data: ${error.message}` });
    }

    const updatedData = {
      name,
      description,
      category,
      subCategory,
      bestSeller: bestSeller === "true",
      price: Number(price),
      weight: Number(weight),
      stock: Number(stock),
      sku,
      variants: parsedVariants,
    };

    const images = [req.files?.image1?.[0], req.files?.image2?.[0], req.files?.image3?.[0], req.files?.image4?.[0]].filter(Boolean);
    if (images.length > 0) {
      const imagesURI = await Promise.all(
        images.map(async (item) => {
          const result = await cloudinary.uploader.upload(item.path, { resource_type: "image" });
          return result.secure_url;
        })
      );
      updatedData.images = imagesURI;
    }

    const product = await Product.findByIdAndUpdate(productId, updatedData, { new: true });
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.json({ success: true, message: "Product updated successfully", product });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export { addProduct, getProducts, getProductById, deleteProduct, editProduct };















































































