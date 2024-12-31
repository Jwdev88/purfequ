import jwt from 'jsonwebtoken';

const authUser = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]; // Ambil token dari header

  if (!token) {
    return res.status(401).json({ message: "Token tidak ditemukan. Silakan login." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verifikasi token
    req.userId = decoded.userId; // Simpan userId ke req
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token tidak valid atau sudah kedaluwarsa." });
  }
};

export default authUser;
