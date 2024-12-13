import express from "express";
import {
  addProduct,
  deleteProduct,
  editProduct,
  getProductById,
  getProducts,
 
} from "../controllers/productController.js";
import upload from "../middleware/multer.js";
import adminAuth from "../middleware/adminAuth.js";

const productRouter = express.Router();

productRouter.post(
  "/add",
 
  upload.fields([
    { name: "image1", maxCount: 1 },
    { name: "image2", maxCount: 1 },
    { name: "image3", maxCount: 1 },
    { name: "image4", maxCount: 1 },
  ]),
  adminAuth,
  (req, res) => { 
    try {
      addProduct(req, res);
    } catch (error) {
      console.error("Error in addProduct:", error);
      res.status(500).json({ success: false, message: "Failed to add product" });
    }
  }
);
productRouter.post("/delete", adminAuth, deleteProduct);
productRouter.get("/:Id/get", getProductById);
productRouter.get("/list", getProducts);
productRouter.put(
  "/edit/:productId",
  adminAuth,
  upload.fields([
    { name: "image1", maxCount: 1 },
    { name: "image2", maxCount: 1 },
    { name: "image3", maxCount: 1 },
    { name: "image4", maxCount: 1 },
  ]),
  editProduct
);

export default productRouter;
