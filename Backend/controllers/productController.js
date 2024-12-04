import { v2 as cloudinary } from "cloudinary";
import productModel from "../models/productModel.js";
import mongoose from "mongoose";

const addProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      subCategory,
      sizes,
      bestseller,
    } = req.body;

    const image1 = req.files.image1 && req.files.image1[0];
    const image2 = req.files.image2 && req.files.image2[0];
    const image3 = req.files.image3 && req.files.image3[0];
    const image4 = req.files.image4 && req.files.image4[0];

    const images = [image1, image2, image3, image4].filter(
      (item) => item !== undefined
    );
    const imagesURI = await Promise.all(
      images.map(async (item) => {
        let result = await cloudinary.uploader.upload(item.path, {
          resource_type: "image",
        });
        return result.secure_url;
      })
    );

    const productData = {
      name,
      description,
      category,
      price: Number(price),
      subCategory,
      bestseller: bestseller === "true" ? true : false,
      sizes: JSON.parse(sizes),
      image: imagesURI,
      date: Date.now(),
    };

    console.log(productData);

    const product = new productModel(productData);
    await product.save();

    res
      .status(201)
      .json({ success: true, message: "Product berhasil ditambahkan" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const listProducts = async (req, res) => {
  try {
    const products = await productModel.find({});
    res.json({ success: true, products });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const removeProduct = async (req, res) => {
  try {
    await productModel.findByIdAndDelete(req.body.id);
    res.json({ success: true, message: "Product berhaasil didelete" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const singleProduct = async (req, res) => {
  try {
    const { Id } = req.params;

    if (!Id || !mongoose.Types.ObjectId.isValid(Id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid productId" });
    }

    const product = await productModel.findById(Id);
    res.json({ success: true, product });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// updateProductForAdminPanel
const updateProduct = async (req, res) => {
  try {
    // 2. Validasi Input
    const { productId } = req.params; // Get productId from URL parameters
    const {
      name,
      description,
      price,
      category,
      subCategory,
      sizes,
      bestseller,
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

    // ... (add validation for other fields as needed)

    // 3. Ambil Data Produk dari Database
    const product = await productModel.findOneAndUpdate(
      { _id: productId },
      {
        name: name || product.name,
        description: description || product.description,
        price: price || product.price,
        category: category || product.category,
        subCategory: subCategory || product.subCategory,
        sizes: sizes ? JSON.parse(sizes) : product.sizes, 
        bestseller: bestseller === "true" ? true : false,
        
      },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // Handle image updates with Cloudinary
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
            throw uploadError; // Re-throw the error to be caught by the outer try...catch
          }
        })
      );
      product.image = imagesURI;
    }

    // 5. Simpan perubahan
    await product.save();

    // 6. Kirim Response
    res.json({ success: true, message: "Product updated successfully" });
  } catch (error) {
    // 7. Error Handling
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export {
  addProduct,
  removeProduct,
  singleProduct,
  listProducts,
  updateProduct,
};