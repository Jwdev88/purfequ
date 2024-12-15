import Category from "../models/categoryModel.js";
import SubCategory from "../models/subCategoryModel.js";
import { v2 as cloudinary } from "cloudinary";

// Create a new category
const createCategory = async (req, res) => {
  try {
    const { name, description, status } = req.body;
    const imageFile = req.file;

    // Validation
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

    // Upload image to Cloudinary
    const imageURI = await uploadImageToCloudinary(imageFile);

    const categoryData = {
      name,
      description,
      status: status || "active",
      image: imageURI,
    };

    const newCategory = new Category(categoryData);
    await newCategory.save();

    res.status(201).json({
      success: true,
      message: "Category created successfully",
    });
  } catch (error) {
    console.error("Error creating category:", error);

    if (error.code === "ENOENT") {
      return res.status(500).json({
        success: false,
        message: `File not found: ${error.path}`,
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create category",
    });
  }
};

async function uploadImageToCloudinary(imageFile) {
  try {
    const result = await cloudinary.uploader.upload(imageFile.path, {
      resource_type: "image",
    });
    return result.secure_url;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw error; // Re-throw the error to be caught by the outer try-catch block
  }
}
// Get all categories
const getCategories = async (req, res) => {
  try {
    // Fetch Categories
    const categories = await Category.find();
    const subCategories = await SubCategory.find().populate("category");

    // Process categories with Cloudinary image data
    const categoriesWithImageData = await Promise.all(
      categories.map(async (category) => {
        let imageData = null;

        if (typeof category.image === "string") {
          try {
            const publicId = category.image.split("/").pop().split(".")[0];
            const cloudinaryData = await cloudinary.api.resource(publicId);
            imageData = cloudinaryData.secure_url; // Ambil URL aman dari Cloudinary
          } catch (cloudinaryError) {
            console.error("Cloudinary error:", cloudinaryError);
          }
        }

        return {
          _id: category._id,
          name: category.name,
          image: imageData || category.image, // Fallback jika Cloudinary gagal
        };
      })
    );

    // Process SubCategories to flatten populated data
    const formattedSubCategories = subCategories.map((subCategory) => ({
      _id: subCategory._id,
      name: subCategory.name,
      description: subCategory.description || null,
      status: subCategory.status,
      categoryId: subCategory.category ? subCategory.category._id : null,
      categoryName: subCategory.category
        ? subCategory.category.name
        : "Unassigned",
      image: subCategory.image,
    }));

    // Send Response
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
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }

    const category = await Category.findById(id);

    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }

    // Fetch image data from Cloudinary (if applicable)
    let imageData = [];
    if (category.image) {
      try {
        const publicId = category.image.split("/").pop().split(".")[0];
        const cloudinaryData = await cloudinary.api.resource(publicId);
        imageData = [cloudinaryData];
      } catch (cloudinaryError) {
        console.error("Cloudinary error:", cloudinaryError);
        // Handle Cloudinary error (e.g., log, return a default image)
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
      return res
        .status(400)
        .json({ success: false, message: "Invalid category ID format" });
    }
    console.error("Error fetching category:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch category" });
  }
};
// Update a category
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, status } = req.body;
    const imageFile = req.file; // Get the uploaded image file

    let updatedCategory;
    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path);
        updatedCategory = await Category.findByIdAndUpdate(
          id,
          {
            name,
            description,
            status,
            image: result.secure_url,
          },
          { new: true }
        );
      } catch (cloudinaryError) {
        console.error("Cloudinary upload error:", cloudinaryError);
        return res.status(500).json({
          success: false,
          message: "Failed to upload image to Cloudinary",
        });
      }
    } else {
      updatedCategory = await Category.findByIdAndUpdate(
        id,
        {
          name,
          description,
          status,
        },
        { new: true }
      );
    }

    if (!updatedCategory) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }
    let imageData = [];
    if (updatedCategory.image) {
      if (Array.isArray(updatedCategory.image)) {
        imageData = await Promise.all(
          updatedCategory.image.map(async (imageUrl) => {
            const publicId = imageUrl.split("/").pop().split(".")[0];
            try {
              return await cloudinary.api.resource(publicId);
            } catch (cloudinaryError) {
              console.error(
                "Error fetching image data from Cloudinary:",
                cloudinaryError
              );
              // Handle the error gracefully (e.g., log, return a default image)
              return null;
            }
          })
        );
      } else if (typeof updatedCategory.image === "string") {
        // Handle cases where 'image' is a single string (older data format)
        const publicId = updatedCategory.image.split("/").pop().split(".")[0];
        try {
          imageData = [await cloudinary.api.resource(publicId)];
        } catch (cloudinaryError) {
          console.error(
            "Error fetching image data from Cloudinary:",
            cloudinaryError
          );
          // Handle the error gracefully
          imageData = [];
        }
      }
    }
    res
      .status(200)
      .json({ success: true, message: "Category updated successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a category
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedCategory = await Category.findByIdAndDelete(id);
    if (!deletedCategory) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }
    res.json({ success: true, message: "Category deleted successfully" });
  } catch (error) {
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
