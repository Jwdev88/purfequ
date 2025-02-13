import express from "express";
import {
    registerUser,
    loginUser,
    adminLogin,
    updateProfile,
    addAddress,
    updateAddress,
    deleteAddress,
    getAddresses,
    getUser,
    getAddressById,
    getUserFromToken
} from "../controllers/userController.js"; // Path yang benar
import authUser from "../middleware/Auth.js";

const userRouter = express.Router();

// Public routes
userRouter.post('/register', registerUser);
userRouter.post('/login', loginUser);
userRouter.post('/admin/login', adminLogin); // Sebaiknya /admin/login

// Protected routes (memerlukan autentikasi)
userRouter.put("/profile", authUser, updateProfile);
userRouter.post("/address", authUser, addAddress);
userRouter.put("/address/:addressId", authUser, updateAddress);
userRouter.delete("/address/:addressId", authUser, deleteAddress);
userRouter.get("/addresses", authUser, getAddresses);
userRouter.get("/me", authUser, getUser);
userRouter.get("/address/:addressId", authUser, getAddressById); //  <-- TAMBAHKAN INI!
export default userRouter;