import mongoose from "mongoose";

// const variantOptionSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   stock: { type: Number, required: true, min: 0 },
//   price: { type: Number, required: true, min: 0 },
//   sku: { type: String, required: true, unique: true },
//   weight: { type: Number, required: true, min: 0 },
// });
// Schema for Variant Options
const variantOptionSchema = new mongoose.Schema({
  name: { type: String, required: true },    // Example: "Small", "Red"
  sku: { type: String, required: true, unique: true },  // SKU for this option
  price: { type: Number, required: true },   // Price for this option
  stock: { type: Number, required: true, min: 0 },  // Stock for this option
  weight: { type: Number, required: true, min: 0 }, // Weight for this option
  optionId: { type: mongoose.Schema.Types.ObjectId, ref: "VariantOption", required: true }, // Option ID ref
});

const VariantOption = mongoose.models.VariantOption || mongoose.model("VariantOption", variantOptionSchema);
// Variant schema
const variantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  options: [variantOptionSchema], // Array of variant options
});

// Product Schema
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
      required: function () {
        return this.variants.length === 0;
      },
    },
    variants: [variantSchema], // Array of variants
    bestSeller: { type: Boolean, default: false },
    rating: { type: Number, default: 5, min: 0, max: 5 },
  },
  {
    timestamps: true,
  }
);

// Export the model
const Product = mongoose.models.product || mongoose.model("Product", productSchema);

export default Product; 