import { v2 as cloudinary } from "cloudinary";
import Product from "../models/productModel.js";
import Category from "../models/categoryModel.js";
import mongoose from "mongoose";

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
          if (!option.name || typeof option.stock !== "number") {
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

    const image1 = req.files.image1 && req.files.image1[0];
    const image2 = req.files.image2 && req.files.image2[0];
    const image3 = req.files.image3 && req.files.image3[0];
    const image4 = req.files.image4 && req.files.image4[0];

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid productId" });
    }

    const updatedData = {
      name: name,
      description: description,
      sku: sku,
      price: price,
      category: category,
      subCategory: subCategory,
      variants: variants ? JSON.parse(variants) : undefined, // Menggunakan variants
      bestSeller: bestSeller === "true" ? true : false,
      stock: stock,
      weight: weight,
      
      // Update stock only if variants are provided
      // variants ? calculateAverageWeight(JSON.parse(variants)) : undefined, // Update berat (opsional)
    };

    const product = await Product.findByIdAndUpdate(productId, updatedData, {
      new: true,
    });

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    const images = [image1, image2, image3, image4].filter(
      (item) => item !== undefined
    );

    if (images.length > 0) {
      const imagesURI = await Promise.all(
        images.map(async (item) => {
          try {
            let result = await cloudinary.uploader.upload(item.path, {
              resource_type: "image",
            });
            return result.secure_url;
          } catch (uploadError) {
            console.error("Cloudinary upload error:", uploadError);
            throw uploadError;
          }
        })
      );
      product.images = imagesURI; // Menggunakan 'images' sesuai skema
    }

    await product.save();

    res.json({ success: true, message: "Product updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
const deleteProduct = async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.body.id);
    if (!deletedProduct)
      return res.status(404).json({ message: "Produk tidak ditemukan" });
    res.status(200).json({ message: true, message: "Produk berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getProductById = async (req, res) => {
  try {
    const { Id } = req.params;

    if (!Id || !mongoose.Types.ObjectId.isValid(Id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid productId" });
    }

    const product = await Product.findById(Id)
      .populate("category subCategory")
      .populate("variants")
      .populate("variants.options");
    res.json({ success: true, product });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const getProducts = async (req, res) => {
  try {
    const products = await Product.find({})
      .populate("category")
      .populate("category subCategory")

      .populate("variants")
      .populate("variants.options");
    res.status(200).json({ success: true, products: products });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Gagal memuat data produk.",
    });
  }
};

export { addProduct, deleteProduct, getProductById, getProducts, editProduct };
