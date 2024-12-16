import Category from "../models/categoryModel.js";
import SubCategory from "../models/subCategoryModel.js";
import { v2 as cloudinary } from "cloudinary";

// Helper function to upload images to Cloudinary
async function uploadImageToCloudinary(imageFile) {
  try {
    const result = await cloudinary.uploader.upload(imageFile.path, {
      resource_type: "image",
    });
    return result.secure_url;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw new Error("Failed to upload image");
  }
}

// Create a new category
const createCategory = async (req, res) => {
  try {
    const { name, description, status } = req.body;
    const imageFile = req.file;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Category validation failed: name is required",
      });
    }
    if (!imageFile) {
      return res.status(400).json({
        success: false,
        message: "Category validation failed: image is required",
      });
    }

    const imageURI = await uploadImageToCloudinary(imageFile);

    const newCategory = new Category({
      name,
      description,
      status: status || "active",
      image: imageURI,
    });
    await newCategory.save();

    res.status(201).json({
      success: true,
      message: "Category created successfully",
    });
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create category",
    });
  }
};

// Get all categories
const getCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    const subCategories = await SubCategory.find().populate("category");

    const categoriesWithImageData = await Promise.all(
      categories.map(async (category) => {
        let imageData = null;
        if (typeof category.image === "string") {
          try {
            const publicId = category.image.split("/").pop().split(".")[0];
            const cloudinaryData = await cloudinary.api.resource(publicId);
            imageData = cloudinaryData.secure_url;
          } catch (cloudinaryError) {
            console.error("Cloudinary error:", cloudinaryError);
          }
        }
        return {
          _id: category._id,
          name: category.name,
          image: imageData || category.image,
        };
      })
    );

    const formattedSubCategories = subCategories.map((subCategory) => ({
      _id: subCategory._id,
      name: subCategory.name,
      description: subCategory.description || null,
      status: subCategory.status,
      categoryId: subCategory.category ? subCategory.category._id : null,
      categoryName: subCategory.category ? subCategory.category.name : "Unassigned",
      image: subCategory.image,
    }));

    res.status(200).json({
      success: true,
      categories: categoriesWithImageData,
      subCategories: formattedSubCategories,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
    });
  }
};

// Get a single category by ID
const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    let imageData = [];
    if (category.image) {
      try {
        const publicId = category.image.split("/").pop().split(".")[0];
        const cloudinaryData = await cloudinary.api.resource(publicId);
        imageData = [cloudinaryData];
      } catch (cloudinaryError) {
        console.error("Cloudinary error:", cloudinaryError);
      }
    }

    res.json({
      success: true,
      category: {
        ...category.toObject(),
        imageData: imageData,
      },
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid category ID format" });
    }
    console.error("Error fetching category:", error);
    res.status(500).json({ success: false, message: "Failed to fetch category" });
  }
};

// Update a category
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, status } = req.body;
    const imageFile = req.file;

    let updatedCategory;
    if (imageFile) {
      const imageURI = await uploadImageToCloudinary(imageFile);
      updatedCategory = await Category.findByIdAndUpdate(
        id,
        { name, description, status, image: imageURI },
        { new: true }
      );
    } else {
      updatedCategory = await Category.findByIdAndUpdate(
        id,
        { name, description, status },
        { new: true }
      );
    }

    if (!updatedCategory) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    let imageData = [];
    if (updatedCategory.image) {
      const publicId = updatedCategory.image.split("/").pop().split(".")[0];
      try {
        imageData = [await cloudinary.api.resource(publicId)];
      } catch (cloudinaryError) {
        console.error("Error fetching image data from Cloudinary:", cloudinaryError);
        imageData = [];
      }
    }

    res.status(200).json({ success: true, message: "Category updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a category
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedCategory = await Category.findByIdAndDelete(id);
    if (!deletedCategory) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }
    res.json({ success: true, message: "Category deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};