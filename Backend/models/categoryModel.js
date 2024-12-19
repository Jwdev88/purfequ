import mongoose from "mongoose";

// Define a regex pattern for URL validation
const urlRegex = /^(ftp|http|https):\/\/[^ "]+$/;

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    image: {
      type: String,
      validate: {
        validator: function (v) {
          return urlRegex.test(v);
        },
        message: props => `${props.value} is not a valid URL!`
      },
      default: "https://example.com/default-image.jpg" // Default image URL
    },
    description: { type: String },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' }
  },
  {
    timestamps: true // Automatically manage createdAt and updatedAt
  }
);

const Category = mongoose.models.Category || mongoose.model("Category", categorySchema);

export default Category;