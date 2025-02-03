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

            if (
              !option.name ||
              isNaN(option.stock) ||
              isNaN(option.price) ||
              isNaN(option.weight)
            ) {
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
          message:
            "Nama, harga, stok, dan SKU diperlukan untuk produk tanpa varian.",
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

      const existingSKUs = await Product.find({
        "variants.options.sku": { $in: allSKUs },
      }).select("variants.options.sku");

      if (existingSKUs.length > 0) {
        return res.status(400).json({
          success: false,
          message: `SKU berikut sudah terdaftar: ${existingSKUs
            .map((p) => p.sku)
            .join(", ")}`,
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
    res
      .status(500)
      .json({ success: false, message: "Terjadi kesalahan server" });
  }
};
const deleteProduct = async (req, res) => {
  const { productId } = req.body;
  try {
    // Assuming you have a Product model
    const product = await Product.findByIdAndDelete(productId);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Produk tidak ditemukan" });
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
      removeVariants, // Flag untuk menghapus varian
    } = req.body;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: "ID produk tidak valid" });
    }

    const updatedData = {
      name,
      description,
      category,
      subCategory,
      bestSeller: bestSeller === "true",
    };

    const removeVariantsFlag = req.body.removeVariants === "true";

    if (removeVariantsFlag) {
      // Hapus varian dan update field non-varian
      try {
        await Product.findByIdAndUpdate(productId, { $unset: { variants: 1 } }, { new: true });
        await Product.findByIdAndUpdate(productId, {
          price: Number(price) || 0,
          weight: Number(weight) || 0,
          stock: Number(stock) || 0,
          sku,
        }, { new: true });
      } catch (err) {
        console.error("Error menghapus varian:", err);
        return res.status(500).json({ success: false, message: "Gagal menghapus varian." });
      }
    } else if (variants) {
      try {
        const parsedVariants = typeof variants === "string" ? JSON.parse(variants) : variants;

        if (!Array.isArray(parsedVariants)) {
          throw new Error("Variants harus berupa array");
        }

        parsedVariants.forEach((variant, index) => {
          if (!variant.name || !Array.isArray(variant.options)) {
            throw new Error(`Struktur variant tidak valid pada indeks ${index}`);
          }
          variant.options.forEach((option, optIndex) => {
            option.stock = Number(option.stock) || 0;
            option.price = Number(option.price) || 0;
            option.weight = Number(option.weight) || 0;

            if (
              !option.name ||
              typeof option.stock !== "number" ||
              typeof option.price !== "number" ||
              typeof option.weight !== "number" ||
              typeof option.sku !== "string" ||
              !option.sku
            ) {
              throw new Error(`Struktur opsi tidak valid pada variant ${index}, opsi ${optIndex}`);
            }
          });
        });

        updatedData.variants = parsedVariants;
        // Hapus field non-varian jika ada varian
        updatedData.$unset = { price: 1, weight: 1, stock: 1, sku: 1 };


      } catch (error) {
        return res.status(400).json({ success: false, message: `Data variant tidak valid: ${error.message}` });
      }
    } else {
      // Update data non-varian jika tidak ada varian dan removeVariantsFlag false
      updatedData.price = Number(price) || 0;
      updatedData.weight = Number(weight) || 0;
      updatedData.stock = Number(stock) || 0;
      updatedData.sku = sku;
    }

    // Handle gambar yang diunggah
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

    // Handle existing images
    let existingImages = [];
    for (let i = 1; i <= 4; i++) {
      if (req.body[`existingImage${i}`]) {
        existingImages.push(req.body[`existingImage${i}`]);
      }
    }

    if (existingImages.length > 0) {
      if (updatedData.images) {
        updatedData.images = [...updatedData.images, ...existingImages];
      } else {
        updatedData.images = existingImages;
      }
    }

    const product = await Product.findByIdAndUpdate(productId, updatedData, { new: true });

    if (!product) {
      return res.status(404).json({ success: false, message: "Produk tidak ditemukan" });
    }

    res.json({ success: true, message: "Produk berhasil diperbarui", product });

  } catch (error) {
    console.error("Error memperbarui produk:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export { addProduct, getProducts, getProductById, deleteProduct, editProduct };
