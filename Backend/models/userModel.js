import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  variants: [
    {
      variantId: { type: mongoose.Schema.Types.ObjectId, ref: "Variant", required: true }, // ID Varian
      optionId: { type: mongoose.Schema.Types.ObjectId, required: true }, // ID Opsi
    }
  ],
  quantity: { type: Number, required: true, default: 1 }, // Jumlah item di keranjang
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
