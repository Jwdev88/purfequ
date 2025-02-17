// middleware/authUser.js
import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js"; // Correct model import

const authUser = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization"); // Correct header name
    if (!authHeader) {
      return res
        .status(401)
        .json({ success: false, message: "Token tidak disediakan." });
    }

    const token = authHeader.replace("Bearer ", ""); // Correctly removes "Bearer "
    // console.log("Received token:", token); // Debug: Log the token -  Remove in production

    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Correct jwt.verify and env variable
    // console.log("Decoded payload:", decoded); // Debug: Log the decoded payload - Remove in production

    const user = await userModel.findById(decoded.userId); // Correct: using decoded.userId

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Pengguna tidak ditemukan." });
    }

    req.user = user;  // Correctly setting req.user
    req.userId = decoded.userId; // Correctly setting req.userId
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
      // console.error("Kesalahan autentikasi:", error); // Log *all* errors
      return res
        .status(401) // Consistent 401 for auth failures
        .json({ success: false, message: "Autentikasi gagal." });
    }
  }
};

export default authUser;