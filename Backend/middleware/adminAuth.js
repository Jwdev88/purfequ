// middleware/adminAuth.js
import jwt from "jsonwebtoken";

const adminAuth = async (req, res, next) => {
  try {
    const { token } = req.headers; // Ambil token dari headers
    if (!token) {
      return res
        .status(401)
        .json({
          success: false,
          message: "Tidak Terotorisasi. Silakan login kembali.",
        }); // Lebih baik pakai status code
    }

    let decodedToken;
    try {
      decodedToken = jwt.verify(token, process.env.JWT_SECRET);
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
          .json({ success: false, message: "Token error." });
      }
    }

    if (decodedToken !== process.env.ADMIN_EMAIL + process.env.ADMIN_PASSWORD) {
      return res
        .status(403)
        .json({ success: false, message: "Akses ditolak." }); // 403 Forbidden lebih tepat
    }

    next();
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Terjadi kesalahan pada server." }); // 500 Internal Server Error
  }
};

export default adminAuth;
