import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, maxlength: 255 },
    description: { type: String, required: true },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    subCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubCategory",
      required: true,
    },
    price: { type: Number, required: true, min: 0 }, // Price must be non-negative
    discount: { type: Number, default: 0, min: 0, max: 100 }, // Percent discount
    stock: { type: Number, required: true, min: 0 }, // Ensure stock is non-negative
    weight: { type: Number, required: true, min: 0 }, // Weight must be in grams
    minOrder: { type: Number, default: 1, min: 1 }, // Minimum quantity to order
    images: [
      { type: String, required: true, validate: /\bhttps?:\/\/\S+\b/ }, // Validate URL format
    ],
    sku: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    variants: [
      {
        name: { type: String, required: true }, // e.g., "Color"
        options: [
          {
            name: { type: String, required: true }, // e.g., "Red"
            stock: { type: Number, required: true, min: 0 },
            price: { type: Number, required: true, min: 0 },
            sku: { type: String, required: true, unique: true },
            // image: { type: String, validate: }, // Optional image
            weight: { type: Number, required: true, min: 0 },
          },
        ],
      },
    ],
    bestSeller: { type: Boolean, default: false },
    rating: { type: Number, default: 5, min: 0, max: 5 }, // Min/max constraints
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true, // Automatically handles createdAt and updatedAt
  }
);

// Automatically update `updatedAt` timestamp
productSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Export the model
const Product = mongoose.models.product || mongoose.model("product", productSchema);

export default Product;
