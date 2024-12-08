import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, maxlength: 255 },
  description: { type: String, required: true },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category", // Relasi dengan model Category
    required: true,
  },
  subCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SubCategory", // Relasi dengan model SubCategory
    required: true,
  },
  // brand: { type: String },
  // shop: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: "Shop", // Relasi dengan model Shop (toko)
  //   required: true,
  // },
  price: { type: Number, required: true },
  // discount: { type: Number, default: 0 }, // Diskon dalam persen
  stock: { type: Number, required: true },
  weight: { type: Number }, // Dalam gram
  // condition: { type: String, enum: ["new", "used"], default: "new" }, // Kondisi produk
  // minOrder: { type: Number, default: 1 }, // Minimum order quantity
  // preorder: { type: Boolean, default: false }, // Preorder atau tidak
  // preorderDuration: { type: Number }, // Durasi preorder dalam hari (jika preorder = true)
  images: [{ type: String, required: true }], // Array of image URLs
  sku: { type: String, unique: true }, // SKU unik untuk produk
  variants: [
    {
      name: { type: String, required: true }, // Nama varian (misal: "Warna")
      options: [
        {
          name: { type: String, required: true }, // Nama opsi (misal: "Merah")
          stock: { type: Number, required: true },
          price: { type: Number }, // Harga bisa berbeda per varian
          sku: { type: String }, // SKU untuk varian
          // image: { type: String }, // Gambar untuk varian
          weight: { type: Number }, // Berat dalam gram
        },
      ],
    },
  ],
  bestSeller: { type: Boolean, default: false },
  rating: { type: Number, default: 0 }, // Rating produk
  // sold: { type: Number, default: 0 }, // Jumlah produk terjual
  // views: { type: Number, default: 0 }, // Jumlah views produk
  // status: { type: String, enum: ["active", "inactive"], default: "active" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

productSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const Product =
  mongoose.models.product || mongoose.model("product", productSchema);

export default Product;
