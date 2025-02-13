import validator from "validator";
import bcrypt from "bcrypt";
import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken";

// --- Fungsi-fungsi Helper ---
const createToken = (id) => {
  return jwt.sign({ userId: id }, process.env.JWT_SECRET, { expiresIn: "1d" }); // Sertakan userId di payload
};


// --- Middleware untuk mendapatkan user dari token ---
export const getUserFromToken = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1]; // "Bearer TOKEN"

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await userModel.findById(decoded.userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        req.user = user;
        req.userId = decoded.userId;// Simpan user dan userId di request object
        next();
    } catch (error) {
        console.error(error);
         if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Unauthorized: Token expired' });
        }
        return res.status(401).json({ message: 'Unauthorized: Invalid token' });
    }
};

// --- Fungsi-fungsi CRUD Profil & Alamat ---

// 1. Update Profil Umum (Nama, Email, Password)
export const updateProfile = async (req, res) => {
  try {
    const userId = req.userId; // Ambil ID dari middleware
    const { name, email, currentPassword, newPassword, confirmNewPassword } = req.body;

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update Nama
    if (name) {
      user.name = name;
    }

    // Update Email
    if (email) {
      if (!validator.isEmail(email)) {
        return res.status(400).json({ message: "Invalid email format." });
      }
      const emailExists = await userModel.findOne({ email, _id: { $ne: userId } });
      if (emailExists) {
        return res.status(400).json({ message: "Email already in use." });
      }
      user.email = email;
    }

    // Update Password
    if (currentPassword && newPassword) {
      if (newPassword.length < 8) {
        return res.status(400).json({ message: "New password must be at least 8 characters." });
      }
      if (newPassword !== confirmNewPassword) {
        return res.status(400).json({ message: "New password and confirmation do not match." });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: "Incorrect current password." });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      user.password = hashedPassword;
    }

    await user.save();
    res.json({ message: "Profile updated successfully.", user: { name: user.name, email: user.email } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating profile.", error: error.message });
  }
};

// 2. Menambah Alamat Baru
// ... (import dan fungsi lain) ...

export const addAddress = async (req, res) => {
  try {
    const userId = req.userId;
    // Perubahan di sini: Terima cityId, provinceId
    const { firstName, lastName, email, phone, street, city,province, state, postalCode, cityId, provinceId } = req.body;

     if (!firstName || !lastName || !email || !phone || !street || !city || !state || !postalCode || !cityId || !provinceId) {
        return res.status(400).json({ message: 'All address fields are required' });
    }

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Perubahan di sini: Gunakan cityId, provinceId, dan street
    const newAddress = { firstName, lastName, email, phone, street, city, cityId, province, provinceId, state, postalCode };
    user.address.push(newAddress);
    await user.save();

    const updatedUser = await userModel.findById(userId);
    res.status(201).json({ message: 'Address added successfully', address: updatedUser.address });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error adding address', error: error.message });
  }
};
// ... fungsi yang lain tidak berubah ...

// 3. Update Address
export const updateAddress = async (req, res) => {
    try {
        const userId = req.userId;
        const { addressId } = req.params;
        const { firstName, lastName, email, phone, street, city,cityId, state, postalCode, province,provinceId } = req.body; //tambahkan cityId, dan provinceId

        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const addressToUpdate = user.address.id(addressId);
        if (!addressToUpdate) {
            return res.status(404).json({ message: 'Address not found' });
        }

        // Update fields (gunakan optional chaining untuk menghindari error jika field tidak ada)
        if (firstName) addressToUpdate.firstName = firstName;
        if (lastName) addressToUpdate.lastName = lastName;
        if (email) addressToUpdate.email = email;
        if (phone) addressToUpdate.phone = phone;
        if (street) addressToUpdate.street = street;
        if (city) addressToUpdate.city = city;
        if(cityId) addressToUpdate.cityId = cityId;
        if (state) addressToUpdate.state = state;
        if (postalCode) addressToUpdate.postalCode = postalCode;
        if(province) addressToUpdate.province = province;
        if(provinceId) addressToUpdate.provinceId = provinceId;

        await user.save();
        const updatedUser = await userModel.findById(userId);
        res.json({ message: 'Address updated successfully', address: updatedUser.address });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating address', error: error.message });
    }
};

// 4. Menghapus Alamat
export const deleteAddress = async (req, res) => {
  try {
    const userId = req.userId;
    const { addressId } = req.params;

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.address.pull({ _id: addressId }); // Cara yang benar menghapus subdokumen
    await user.save();
    const updatedUser = await userModel.findById(userId);

    res.json({ message: "Address deleted successfully", address: updatedUser.address });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting address", error: error.message });
  }
};

// 5. Get User Addresses
export const getAddresses = async (req, res) => {
  try {
      const userId = req.userId;
      const user = await userModel.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" }); //  <-- Make sure this returns success: false
      }
      res.json({addresses : user.address}) //  <-- Make sure this returns success: true
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error get user address", error: error.message }); // <-- Make sure this returns success: false
  }
}

// 6. Get User Data (kecuali password)
export const getUser = async (req, res) => {
    try {
        const userId = req.userId;
        const user = await userModel.findById(userId).select('-password'); // Sembunyikan password
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error getting user data", error: error.message });
    }
};

// controllers/userController.js
// In controllers/userController.js
export const getAddressById = async (req, res) => {
  try {
    const userId = req.userId;
    const { addressId } = req.params;

    console.log("getAddressById - userId:", userId); // Log userId
    console.log("getAddressById - addressId:", addressId); // Log addressId

    const user = await userModel.findById(userId);
    if (!user) {
      console.log("getAddressById - User not found"); // Log if user not found
      return res.status(404).json({ message: "User not found" });
    }

    const address = user.address.id(addressId);
    if (!address) {
      console.log("getAddressById - Address not found"); // Log if address not found
      return res.status(404).json({ message: "Address not found" });
    }

    console.log("getAddressById - Sending address:", address); // Log the address data
    res.json({ success:true, address }); // Send the address data // ADD success: true

  } catch (error) {
    console.error("getAddressById - Error:", error); // Log the error
    res.status(500).json({ message: "Error fetching address", error: error.message });
  }
};
// --- Fungsi-fungsi Auth (Login, Register, Admin Login) ---
// (Anda sudah punya, saya sertakan lagi untuk kelengkapan)


export const loginUser = async (req, res) => {
  try {
    
    const {email, password } = req.body;
    const user = await userModel.findOne({ email });
    if (!user) {
        return res.json({ success: false, message: "Email tidak ditemukan" });
        
      }


    const isMatch = await bcrypt.compare(password,user.password)

    if(isMatch){
      const token = jwt.sign(
        { userId: user._id }, // Payload
        process.env.JWT_SECRET, // Secret key
        { expiresIn: "1d" } // Masa berlaku token
      );
        res.json({success:true,token})
    }
    else{
        return res.json({ success: false, message: "email atau password salah" });
    }

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

//route user register

export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const exists = await userModel.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "Email already registered." }); // 400 Bad Request
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: "Invalid email format." });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new userModel({
      name,
      email,
      password: hashedPassword,
    });

    const user = await newUser.save();
    const token = createToken(user._id);
    res.status(201).json({ token }); // 201 Created

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Registration failed", error: error.message });
  }
};

export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
      const token = jwt.sign({ email, password }, process.env.JWT_SECRET); // Payload untuk admin
      res.json({ success: true, token });
    } else {
      res.status(401).json({ success: false, message: "Kredensial salah" }); // 401 Unauthorized
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};