import express from "express";
import {
    createCategory,
    getCategories,
    getCategoryById,
    updateCategory,
    deleteCategory,
} from "../controllers/categoryController.js";

const categoryRouter = express.Router();


categoryRouter.post("/create", createCategory);
categoryRouter.get("/list", getCategories);
categoryRouter.get("/:id/get", getCategoryById);
categoryRouter.put("/update/:id", updateCategory);
categoryRouter.delete("/delete/:id", deleteCategory);


export default categoryRouter;