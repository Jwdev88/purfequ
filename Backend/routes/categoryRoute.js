import express from "express";
import {
    createCategory,
    getCategories,
    getCategoryById,
    updateCategory,
    deleteCategory,
} from "../controllers/categoryController.js";
import upload from "../middleware/multer.js";
import authAdmin from "../middleware/adminAuth.js";

const categoryRouter = express.Router();


categoryRouter.post("/add",upload.single("image"), createCategory);
categoryRouter.get("/list", getCategories);
categoryRouter.get("/:id/get", getCategoryById);
categoryRouter.put("/edit/:id",upload.single("image"), updateCategory);
categoryRouter.delete("/delete/:id", deleteCategory);


export default categoryRouter;