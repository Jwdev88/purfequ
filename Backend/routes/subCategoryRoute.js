import express from "express";
import {
  getSubCategories,
  getSubCategoryById,
  updateSubCategory,
  deleteSubCategory,
  addSubCategory,
} from "../controllers/subCategoryController.js";
import upload from "../middleware/multer.js";
import authAdmin from "../middleware/adminAuth.js";

const subCategoryRouter = express.Router();

subCategoryRouter.get("/list", getSubCategories);
subCategoryRouter.get("/:id/get", getSubCategoryById);
subCategoryRouter.post("/add", upload.single("image"), addSubCategory);
subCategoryRouter.put("/edit/:id",upload.single("image"), updateSubCategory);
subCategoryRouter.delete("/delete/:id", deleteSubCategory);


export default subCategoryRouter;
