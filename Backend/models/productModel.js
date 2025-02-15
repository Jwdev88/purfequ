// --- backend/models/productModel.js ---
import mongoose from "mongoose";

// Schema for Variant Options -  Gunakan _id bawaan, SKU tetap penting
const variantOptionSchema = new mongoose.Schema({
    name: { type: String, required: true },    // Contoh: "Small", "Red"
    sku: { type: String, required: true, unique: false }, // SKU, TIDAK unique
    price: { type: Number, required: true },
    stock: { type: Number, required: true, min: 0 },
    weight: { type: Number, required: true, min: 0 },
    // Hapus optionId -  Gunakan _id default dari MongoDB
});

// Variant schema
const variantSchema = new mongoose.Schema({
    name: { type: String, required: true },
    options: [variantOptionSchema], // Array of variant options
});

// Product Schema - Tidak berubah
const productSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, maxlength: 255 },
        description: { type: String, required: true },
        category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
        subCategory: { type: mongoose.Schema.Types.ObjectId, ref: "SubCategory", required: true },
        price: { type: Number, required: true, min: 0 },
        discount: { type: Number, default: 0, min: 0, max: 100 },
        stock: { type: Number, required: true, min: 0 },
        weight: { type: Number, required: true, min: 0 },
        minOrder: { type: Number, default: 1, min: 1 },
        images: [{ type: String, required: true }],
        sku: {
            type: String,
            trim: true,
            uppercase: true,
           
        },
        variants: [variantSchema], // Array of variants
        bestSeller: { type: Boolean, default: false },
        rating: { type: Number, default: 5, min: 0, max: 5 },
    },
    {
        timestamps: true,
    }
);
const Product = mongoose.models.product || mongoose.model("Product", productSchema);
export default Product;