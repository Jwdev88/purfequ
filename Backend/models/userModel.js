import mongoose from "mongoose";

// Skema untuk Item Keranjang (cartItemSchema)
const cartItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  variantId: { type: mongoose.Schema.Types.ObjectId, ref: "Variant" }, // opsional untuk produk tanpa varian
  optionId: { type: mongoose.Schema.Types.ObjectId }, // opsional untuk produk tanpa varian
  quantity: { type: Number, required: true, default: 1 },
});

const addressSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  street: { type: String, required: true }, // Ganti 'address' jadi 'street'
  city: { type: String, required: true },      // Tetap simpan city name untuk display
  cityId: { type: String, required: true },   // Tambahkan cityId  <-- ID Kota
  province: { type: String, required: true },  // Tetap simpan province name
  provinceId: { type: String, required: true }, // Tambahkan provinceId <-- ID Provinsi
  state: { type: String, required: true },     // State/Provinsi (untuk tampilan)
  postalCode: { type: String, required: true },
}, { _id: true });

// Skema User dengan cartData dan address
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  cartData: {
    type: [cartItemSchema], // Item-item di keranjang
    default: [],
  },
  address: [addressSchema], // Alamat-alamat pengguna
});

// Metode untuk mempopulasi cartData dengan Product, Variant, dan Option terkait
userSchema.methods.populateCart = async function () {
  return this.populate({
    path: "cartData.productId", // Populasi produk
    select: "name description images stock price sku weight variants category subCategory", // Ambil detail dari produk
    populate: [
      {
        path: "category", // Populasi kategori
        select: "name", // Ambil nama kategori
      },
      {
        path: "subCategory", // Populasi subkategori
        select: "name", // Ambil nama subkategori
      },
      {
        path: "variants", // Variants ada di dalam produk
        select: "name options", // Ambil nama dan opsi dari setiap variant
        populate: {
          path: "options.optionId", // Populasi optionId dalam opsi varian
          select: "name price stock sku weight", // Ambil detail dari opsi
        },
      },
    ],
  });
};

export default mongoose.model("User", userSchema);
