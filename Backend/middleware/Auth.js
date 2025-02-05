import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';

export const authUser = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    req.user = user; // Set user data on request
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(401).json({ success: false, message: "Authentication failed" });
  }
};


export default authUser;
