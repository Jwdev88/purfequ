import SubCategory from "../models/subCategoryModel.js";
import mongoose from "mongoose";
const addSubCategory = async (req, res) => {
    try {
        const { name, category } = req.body;
        const exists = await SubCategory.findOne({ name });
        if (exists) {
            return res.status(400).json({ success: false, message: "Subcategory already exists" });
        }
        const newSubCategory = new SubCategory({
            name,
            category,
        });
        await newSubCategory.save();
        res.status(201).json({ success: true, message: "Subcategory added successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const getSubCategories = async (req, res) => {
    try {
        const subCategories = await SubCategory.find().populate("category");
        res.status(200).json({ success: true, subCategories });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const getSubCategoryById = async (req, res) => {
    try {
        const subCategory = await SubCategory.findById(req.params._Id).populate("category");
        if (!subCategory) {
            return res.status(404).json({ success: false, message: "Subcategory not found" });
        }
        res.status(200).json({ success: true, subCategory });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateSubCategory = async (req, res) => {
    try {
        const subCategory = await SubCategory.findByIdAndUpdate(req.params.id, { $set: req.body }, {
            new: true,
        });
        if (!subCategory) {
            return res.status(404).json({ success: false, message: "Subcategory not found" });
        }
        res.status(200).json({ success: true, message: "Subcategory updated successfully" });
    } catch (error) {
        console.log(error);
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
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export { addSubCategory, getSubCategories, getSubCategoryById, updateSubCategory, deleteSubCategory };

