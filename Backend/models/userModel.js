import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  variantId: { type: mongoose.Schema.Types.ObjectId, ref: "Variant", required: true },
  quantity: { type: Number, required: true, default: 1 }, // Default 1 untuk quantity
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  cartData: {
    type: [cartItemSchema],
    default: [], // Array default kosong
  },
});

export default mongoose.model("User", userSchema);
