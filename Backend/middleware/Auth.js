// middleware/authUser.js
import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";

const authUser = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    if (!authHeader) {
      return res
        .status(401)
        .json({ success: false, message: "Token tidak disediakan." });
    }

    const token = authHeader.replace("Bearer ", "");
    // console.log("Received token:", token); // Debug: Log the token


    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // console.log("Decoded payload:", decoded); // Debug: Log the decoded payload

      const user = await userModel.findById(decoded.userId);

      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "Pengguna tidak ditemukan." });
      }

      req.user = user;
      req.userId = decoded.userId;
      next();

    } catch (error) {
      if (error.name === "JsonWebTokenError") {
        return res
          .status(401)
          .json({ success: false, message: "Token tidak valid." });
      } else if (error.name === "TokenExpiredError") {
        return res
          .status(401)
          .json({ success: false, message: "Token kadaluarsa." });
      } else {
        return res
          .status(401) // 401 lebih tepat daripada 500 untuk masalah autentikasi.
          .json({ success: false, message: "Autentikasi gagal." });
      }
    }
  } catch (error) {
    console.error("Kesalahan autentikasi:", error);
    res
      .status(500)
      .json({ success: false, message: "Terjadi kesalahan pada server." });
  }
};

export default authUser;