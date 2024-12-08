import Category from "../models/categoryModel.js";
import SubCategory from "../models/subCategoryModel.js";

// Create a new category
const createCategory = async (req, res) => {
  try {
    const { name, image, description, status } = req.body;
    const newCategory = new Category({ name, image, description, status });
    const savedCategory = await newCategory.save();
    res.json({ success: true, category: savedCategory });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all categories
const getCategories = async (req, res) => {
  try {
    const categories = await Category.find(); 
    const subCategories = await SubCategory.find().populate("category"); 
    res.status(200).json({ 
      success: true, 
      categories, 
      subCategories 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get a single category by ID
const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }
    res.json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update a category
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, image, description, status } = req.body;
    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      { name, image, description, status },
      { new: true }
    );
    if (!updatedCategory) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }
    res.json({ success: true, category: updatedCategory });
  } catch (error) {
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
    res.status(500).json({ success: false, message: error.message });
  }
};

export { createCategory, getCategories, getCategoryById, updateCategory, deleteCategory };

