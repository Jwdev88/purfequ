import express  from "express";

import { getUserCart, addToCart, updateCart, clearCart,removeItemsFromCart } from "../controllers/cartController.js";
import authUser from "../middleware/Auth.js";

const cartRouter = express.Router();

// Route untuk mendapatkan cart
cartRouter.get('/get',authUser, getUserCart);
cartRouter.post('/add',authUser, addToCart);
cartRouter.post('/update',authUser, updateCart);
cartRouter.post('/clear',authUser, clearCart);
cartRouter.post('/remove-items',authUser, removeItemsFromCart);



export default cartRouter;