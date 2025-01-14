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

    // console.log("req.body:", req.body);

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

    // Parse and validate variants data
    let parsedVariants = [];
    if (variants) {
      try {
        parsedVariants =
          typeof variants === "string" ? JSON.parse(variants) : variants;

        if (!Array.isArray(parsedVariants)) {
          throw new Error("Variants harus berupa array");
        }

        const skuSet = new Set();
        parsedVariants.forEach((variant, index) => {
          if (!variant.name || !Array.isArray(variant.options)) {
            throw new Error(`Struktur variant tidak valid di index ${index}`);
          }

          variant.options.forEach((option, optIndex) => {
            option.stock = Number(option.stock);
            option.price = Number(option.price);
            option.weight = Number(option.weight);

            if (!option.name || isNaN(option.stock) || isNaN(option.price) || isNaN(option.weight)) {
              throw new Error(
                `Struktur option tidak valid di variant ${index}, option ${optIndex}`
              );
            }

            if (skuSet.has(option.sku)) {
              throw new Error(
                `SKU duplikat ditemukan di variant ${index}, option ${optIndex}`
              );
            }
            skuSet.add(option.sku);
          });
        });
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: `Data variant tidak valid: ${error.message}`,
        });
      }
    }

    if (!parsedVariants.length) {
      if (!name || !price || !stock || !sku) {
        return res.status(400).json({
          success: false,
          message: "Nama, harga, stok, dan SKU diperlukan untuk produk tanpa varian.",
        });
      }

      const existingProduct = await Product.findOne({ sku });
      if (existingProduct) {
        return res.status(400).json({
          success: false,
          message: "SKU produk sudah terdaftar.",
        });
      }
    } else {
      const allSKUs = parsedVariants.flatMap((variant) =>
        variant.options.map((option) => option.sku)
      );

      const existingSKUs = await Product.find({ "variants.options.sku": { $in: allSKUs } }).select(
        "variants.options.sku"
      );

      if (existingSKUs.length > 0) {
        return res.status(400).json({
          success: false,
          message: `SKU berikut sudah terdaftar: ${existingSKUs.map((p) => p.sku).join(", ")}`,
        });
      }
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
      sku: parsedVariants.length ? undefined : sku,
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
        return res.status(400).json({
          success: false,
          message: "SKU produk sudah terdaftar.",
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
    res
      .status(500)
      .json({ success: false, message: "Gagal memuat data produk" });
  }
};
const getProductById = async (req, res) => {
  try {
    const { Id } = req.params;
    if (!Id || !mongoose.Types.ObjectId.isValid(Id)) {
      return res
        .status(400)
        .json({ success: false, message: "ID produk tidak valid" });
    }

    const product = await Product.findById(Id)
      .populate("category subCategory")
      .populate("variants.options");

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Produk tidak ditemukan" });
    }

    res.json({ success: true, product });
  } catch (error) {
    console.error("Error retrieving product:", error);
    res.status(500).json({ success: false, message: "Terjadi kesalahan server" });
  }
};
const deleteProduct = async (req, res) => {
  const { productId } = req.body;
  try {
    // Assuming you have a Product model
    const product = await Product.findByIdAndDelete(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Produk tidak ditemukan" });
    }
    res.json({ success: true, message: "Produk berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal menghapus produk" });
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
      return res
        .status(400)
        .json({ success: false, message: "ID produk tidak valid" });
    }

    // Parse dan validasi variant
    let parsedVariants;
    try {
      parsedVariants =
        typeof variants === "string" ? JSON.parse(variants) : variants;
      if (!Array.isArray(parsedVariants) || parsedVariants.length === 0) {
        throw new Error("Variants harus berupa array yang tidak kosong");
      }
      parsedVariants.forEach((variant, index) => {
        if (!variant.name || !Array.isArray(variant.options)) {
          throw new Error(`Struktur variant tidak valid pada indeks ${index}`);
        }
        variant.options.forEach((option, optIndex) => {
          option.stock = Number(option.stock);
          option.price = Number(option.price);
          option.weight = Number(option.weight);
          if (!option.name || isNaN(option.stock)) {
            throw new Error(
              `Struktur opsi tidak valid pada variant ${index}, opsi ${optIndex}`
            );
          }
        });
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: `Data variant tidak valid: ${error.message}`,
      });
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

    const images = [
      req.files?.image1?.[0],
      req.files?.image2?.[0],
      req.files?.image3?.[0],
      req.files?.image4?.[0],
    ].filter(Boolean);
    if (images.length > 0) {
      const imagesURI = await Promise.all(
        images.map(async (item) => {
          const result = await cloudinary.uploader.upload(item.path, {
            resource_type: "image",
          });
          return result.secure_url;
        })
      );
      updatedData.images = imagesURI;
    }

    const product = await Product.findByIdAndUpdate(productId, updatedData, {
      new: true,
    });
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Produk tidak ditemukan" });
    }

    res.json({
      success: true,
      message: "Produk berhasil diperbarui",
      product,
    });
  } catch (error) {
    console.error("Error memperbarui produk:", error);
    res.status(500).json({ success: false, message: "Kesalahan server" });
  }
};

export { addProduct, getProducts, getProductById, deleteProduct, editProduct };
