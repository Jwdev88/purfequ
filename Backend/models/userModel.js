// backend/models/userModel.js
import mongoose from "mongoose";
import Product from "../models/productModel.js";
import bcrypt from 'bcrypt';
// Skema untuk Item Keranjang (cartItemSchema) - Disederhanakan
const cartItemSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true }, // Ref ke Product
    variantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product.variants' },      // Opsional: Ref ke Variant
    optionId: { type: mongoose.Schema.Types.ObjectId },  //Ref ke Option // Hapus ref yang tidak valid, tapi simpan fieldnya.
    quantity: { type: Number, required: true, default: 1 },
});

// Skema Alamat (addressSchema) -  Sudah Benar, Tidak Perlu Diubah
const addressSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    street: { type: String, required: true }, // Ganti 'address' jadi 'street'
    city: { type: String, required: true },        // Tetap simpan city name untuk display
    cityId: { type: String, required: true },      // Tambahkan cityId   <-- ID Kota
    province: { type: String, required: true },    // Tetap simpan province name
    provinceId: { type: String, required: true },  // Tambahkan provinceId <-- ID Provinsi
    postalCode: { type: String, required: true },
}, { _id: true });

// Skema User (userSchema) - Perubahan pada cartData dan populateCart
const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        isAdmin: { type: Boolean, required: true, default: false },
        cartData: {
            type: [cartItemSchema], // Item-item di keranjang
            default: [],
        },
        address: [addressSchema], // Alamat-alamat pengguna, sudah benar.
    },
    {
        timestamps: true,
    }
);

// --- Hashing Password (Penting) ---
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Hash password before saving
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// --- Custom populate method for cart (CORRECTED) ---
userSchema.methods.populateCart = async function () {
    return this.populate([
        {
            path: 'cartData.productId',
            select: 'name description category subCategory price discount stock weight minOrder images sku variants bestSeller rating',
            populate: [ // Populate category and subCategory here
                {
                    path: 'category', // Populate the 'category' field
                    select: 'name',  // Select only the 'name' field of the category
                },
                {
                    path: 'subCategory', // Populate the 'subCategory' field
                    select: 'name',   // Select only the 'name' field of the subcategory
                },
                {
                    path: "variants", // Variants ada di dalam produk
                  select: "name options", // Ambil nama dan opsi dari setiap variant
                  populate: {
                    path: "options", // Populasi optionId dalam opsi varian
                    select: "name price stock sku weight", // Ambil detail dari opsi
                  },
                }
            ]
        },
    ]);
};


const User = mongoose.model("User", userSchema);
export default User;