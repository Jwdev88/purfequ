import mongoose from "mongoose";

const subCategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  category: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Category', 
    required: true 
  },
  image: { type: String }, // URL gambar untuk subkategori
  description: { type: String },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

subCategorySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const SubCategory = mongoose.models.SubCategory || mongoose.model("SubCategory", subCategorySchema);

export default SubCategory;