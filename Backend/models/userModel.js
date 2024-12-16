import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  variantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Variant', required: true },
  quantity: { type: Number, required: true, default: 1 },
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  cartData: {
    type: [cartItemSchema],
    default: [],
  },
});

const userModel = mongoose.models.user || mongoose.model("user", userSchema);

export default userModel;