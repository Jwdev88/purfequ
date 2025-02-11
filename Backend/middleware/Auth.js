// middleware/authUser.js
import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js"; // Gunakan nama yang konsisten (userModel)

const authUser = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    if (!authHeader) {
      return res
        .status(401)
        .json({ success: false, message: "Token tidak disediakan." });
    }

    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Token tidak valid." });
    }

    let decoded; // Deklarasikan di luar try/catch
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
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
          .status(401)
          .json({ success: false, message: "Autentikasi gagal." });
      }
    }

    const user = await userModel.findById(decoded.userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Pengguna tidak ditemukan." });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Kesalahan autentikasi:", error);
    res
      .status(500)
      .json({ success: false, message: "Terjadi kesalahan pada server." }); // Lebih baik 500
  }
};

export default authUser;
