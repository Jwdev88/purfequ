import SubCategory from "../models/subCategoryModel.js";
import { v2 as cloudinary } from "cloudinary";
import mongoose from "mongoose";

const addSubCategory = async (req, res) => {
  try {
    const { name, description, status, category } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, message: "File gambar tidak ditemukan." });
    }

    if (!category) {
      return res.status(400).json({ success: false, message: "Category ID is required" });
    }

    const imageUrl = await uploadImageToCloudinary(file);

    const newSubCategory = new SubCategory({
      name,
      description,
      status,
      category,
      image: imageUrl,
    });

    await newSubCategory.save();
    res.status(200).json({ success: true, message: "Subcategory created successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
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
    throw error;
  }
}

const getSubCategories = async (req, res) => {
  try {
    const categoryId = req.query.category;
    const subCategories = await SubCategory.find({ category: categoryId }).populate("category");

    const subCategoriesWithImageData = await Promise.all(
      subCategories.map(async (subCategory) => {
        let imageData = [];
        if (typeof subCategory.image === "string") {
          const publicId = subCategory.image.split("/").pop().split(".")[0];
          try {
            const cloudinaryData = await cloudinary.api.resource(publicId);
            imageData = [cloudinaryData];
          } catch (cloudinaryError) {
            console.error("Cloudinary error:", cloudinaryError);
            imageData = [];
          }
        }

        return {
          ...subCategory.toObject(),
          imageData,
        };
      })
    );

    res.status(200).json({ success: true, subCategories: subCategoriesWithImageData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getSubCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ success: false, message: "SubCategory ID is required" });
    }

    const subcategory = await SubCategory.findById(id).populate("category");

    if (!subcategory) {
      return res.status(404).json({ success: false, message: "Subcategory not found" });
    }

    let imageData = [];
    if (subcategory.image) {
      try {
        const publicId = subcategory.image.split("/").pop().split(".")[0];
        const cloudinaryData = await cloudinary.api.resource(publicId);
        imageData = [cloudinaryData];
      } catch (cloudinaryError) {
        console.error("Cloudinary error:", cloudinaryError);
        imageData = [{ secure_url: "/path/to/default/image.jpg" }];
      }
    }

    res.status(200).json({
      success: true,
      subcategory: {
        ...subcategory.toObject(),
        imageData,
      },
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid Subcategory ID format" });
    }
    console.error("Error getting subcategory by ID:", error);
    res.status(500).json({ success: false, message: "Failed to fetch subcategory", error: error.message });
  }
};

const updateSubCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, status } = req.body;
    const file = req.file;

    let updatedSubCategory;
    if (file) {
      const imageUrl = await uploadImageToCloudinary(file);
      updatedSubCategory = await SubCategory.findByIdAndUpdate(
        id,
        { name, description, status, image: imageUrl },
        { new: true }
      );
    } else {
      updatedSubCategory = await SubCategory.findByIdAndUpdate(
        id,
        { name, description, status },
        { new: true }
      );
    }

    if (!updatedSubCategory) {
      return res.status(404).json({ success: false, message: "Subcategory not found" });
    }

    let imageData = [];
    if (updatedSubCategory.image) {
      const publicId = updatedSubCategory.image.split("/").pop().split(".")[0];
      try {
        imageData = [await cloudinary.api.resource(publicId)];
      } catch (cloudinaryError) {
        console.error("Error fetching image data from Cloudinary:", cloudinaryError);
        imageData = [];
      }
    }

    res.status(200).json({ success: true, message: "Subcategory updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteSubCategory = async (req, res) => {
  try {
    const subCategory = await SubCategory.findByIdAndDelete(req.params.id);
    if (!subCategory) {
      return res.status(404).json({ success: false, message: "Subcategory not found" });
    }
    res.status(200).json({ success: true, message: "Subcategory deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export {
  addSubCategory,
  getSubCategories,
  getSubCategoryById,
  updateSubCategory,
  deleteSubCategory,
};