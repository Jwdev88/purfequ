import express  from "express";

import { getUserCart, addToCart, updateCart, clearCart } from "../controllers/cartController.js";
import authUser from "../middleware/Auth.js";

const cartRouter = express.Router();

// Route untuk mendapatkan cart
cartRouter.post('/get',authUser, getUserCart);
cartRouter.post('/add', addToCart);
cartRouter.post('/update',authUser, updateCart);
cartRouter.post('/clear',authUser, clearCart);


export default cartRouter;