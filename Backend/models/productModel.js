import mongoose from "mongoose";

const variantOptionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  stock: { type: Number, required: true, min: 0 },
  price: { type: Number, required: true, min: 0 },
  sku: { type: String, required: true, unique: true },
  weight: { type: Number, required: true, min: 0 },
});

const variantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  options: [variantOptionSchema],
});

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, maxlength: 255 },
    description: { type: String, required: true },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },
    subCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubCategory",
      required: true,
      index: true,
    },
    price: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0, max: 100 },
    stock: { type: Number, required: true, min: 0 },
    weight: { type: Number, required: true, min: 0 },
    minOrder: { type: Number, default: 1, min: 1 },
    images: [
      {
        type: String,
        required: true,
        validate: {
          validator: function (v) {
            return /^https?:\/\/.+\.(jpg|jpeg|png|webp|avif|gif|svg)$/.test(v);
          },
          message: (props) => `${props.value} is not a valid image URL!`,
        },
      },
    ],
    sku: {
      type: String,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
      required: function () {
        return this.variants.length === 0;
      },
    },
    variants: [variantSchema],
    bestSeller: { type: Boolean, default: false },
    rating: { type: Number, default: 5, min: 0, max: 5 },
  },
  {
    timestamps: true,
  }
);

// Export the model
const Product = mongoose.models.product || mongoose.model("product", productSchema);

export default Product;