// backend/controllers/userController.js
import validator from "validator";
import bcrypt from "bcrypt";
import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken";

// --- Helper Functions ---
const createToken = (id) => {
  return jwt.sign({ userId: id }, process.env.JWT_SECRET, { expiresIn: "1d" });
};

// --- Get User from Token (Middleware - Keep this!) ---
export const getUserFromToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userModel.findById(decoded.userId);  // Use decoded.userId

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    req.user = user;
    req.userId = decoded.userId; // Set userId  <-- IMPORTANT
    next();
  } catch (error) {
    console.error(error); // Log the error for debugging
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Unauthorized: Token expired' });
      }
    return res.status(401).json({ message: 'Unauthorized: Invalid token' });
  }
};



// --- Controller Functions ---

// 1. Update Profile (Corrected)
export const updateProfile = async (req, res) => {
  try {
    const userId = req.userId; // Get ID from middleware
    const { name, email, currentPassword, newPassword, confirmNewPassword } = req.body;

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update Name
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
    res.json({ success: true, message: "Profile updated successfully.", user: { name: user.name, email: user.email } }); // Return success: true
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error updating profile.", error: error.message }); // Return success: false
  }
};


// 2. Add Address (Corrected)
export const addAddress = async (req, res) => {
    try {
        const userId = req.userId;  // Get ID from middleware
        const { firstName, lastName, email, phone, street, city, province, postalCode, cityId, provinceId } = req.body;

        if (!firstName || !lastName || !email || !phone || !street || !city || !postalCode || !cityId || !provinceId) {
          return res.status(400).json({success: false, message: 'All address fields are required' });
        }

        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({success: false, message: 'User not found' });
        }

        const newAddress = { firstName, lastName, email, phone, street, city, cityId, province, provinceId, postalCode };
        user.address.push(newAddress);
        await user.save();

        res.status(201).json({ success: true, message: 'Address added successfully', address: newAddress }); // Return success: true and the *new* address

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error adding address', error: error.message }); // Return success: false
    }
};


// 3. Update Address (Corrected)
export const updateAddress = async (req, res) => {
    try {
        const userId = req.userId; // Get ID from middleware
        const { addressId } = req.params;
        const { firstName, lastName, email, phone, street, city, cityId, postalCode, province, provinceId } = req.body;

        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({success: false, message: 'User not found' });
        }

        const addressToUpdate = user.address.id(addressId); // Use .id() to find subdocument
        if (!addressToUpdate) {
            return res.status(404).json({success: false, message: 'Address not found' });
        }

        // Update fields (use optional chaining to avoid errors if field is not provided)
        if (firstName) addressToUpdate.firstName = firstName;
        if (lastName) addressToUpdate.lastName = lastName;
        if (email) addressToUpdate.email = email;
        if (phone) addressToUpdate.phone = phone;
        if (street) addressToUpdate.street = street;
        if (city) addressToUpdate.city = city;
        if (cityId) addressToUpdate.cityId = cityId;
        if (postalCode) addressToUpdate.postalCode = postalCode;
        if (province) addressToUpdate.province = province;
        if (provinceId) addressToUpdate.provinceId = provinceId;

        await user.save();
        res.json({ success: true, message: 'Address updated successfully', address: addressToUpdate }); // Return success: true

    } catch (error) {
        console.error(error);
        res.status(500).json({ success:false, message: 'Error updating address', error: error.message }); // Return success: false
    }
};

// 4. Delete Address (Corrected)
export const deleteAddress = async (req, res) => {
  try {
    const userId = req.userId; // Get ID from middleware
    const { addressId } = req.params;

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

      // Use .pull() to remove the subdocument
      user.address.pull({ _id: addressId });
      await user.save();
      res.status(200).json({ success: true, message: "Address deleted successfully" }); // Return success: true
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error deleting address", error: error.message }); // Return success: false
  }
};

// 5. Get User Addresses (Corrected)
export const getAddresses = async (req, res) => {
  try {
    const userId = req.userId;  // Get ID from middleware
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({success: false, message: "User not found" });
    }
    res.status(200).json({ success: true, addresses: user.address }); // Return success: true
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error get user address", error: error.message }); // Return success: false
  }
};

// 6. Get User Data (Excluding Password) (Corrected)
export const getUser = async (req, res) => {
    try {
        const userId = req.userId;  // Get ID from middleware
        const user = await userModel.findById(userId).select('-password'); // Exclude password
        if (!user) {
            return res.status(404).json({success: false, message: "User not found" });
        }
        res.status(200).json({success: true, user});  // Consistent success: true
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Error getting user data", error: error.message }); // Return success: false
    }
};


// 7. Get Address by ID (Corrected)
export const getAddressById = async (req, res) => {
  try {
    const userId = req.userId;
    const { addressId } = req.params;

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ success:false, message: "User not found" });
    }

    const address = user.address.id(addressId);
    if (!address) {
      return res.status(404).json({success: false, message: "Address not found" });
    }

    res.status(200).json({ success: true, address }); // Return success: true and the address
  } catch (error) {
    console.error("Error fetching address:", error);
    res.status(500).json({ success: false, message: "Error fetching address", error: error.message }); // Return success: false
  }
};

// --- Auth Functions (Login, Register, Admin Login) ---
// (Keep these as you have them, but I'm including them for completeness)
export const registerUser = async (req, res) => {
    try {
      const { name, email, password } = req.body;
  
      const exists = await userModel.findOne({ email });
      if (exists) {
        return res.status(400).json({success: false, message: "Email already registered." }); // 400 Bad Request
      }
  
      if (!validator.isEmail(email)) {
        return res.status(400).json({ success: false, message: "Invalid email format." });
      }
      if (password.length < 8) {
        return res.status(400).json({ success: false, message: "Password must be at least 8 characters." });
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
      res.status(201).json({success: true, token }); // 201 Created
  
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Registration failed", error: error.message });
    }
  };
  
  export const loginUser = async (req, res) => {
    try {
        const {email, password } = req.body;
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(401).json({ success: false, message: "Email tidak ditemukan" }); // Use 401 for auth errors
        }
        const isMatch = await bcrypt.compare(password,user.password)

        if(isMatch){
           const token = jwt.sign(
             { userId: user._id }, // Payload
             process.env.JWT_SECRET, // Secret key
             { expiresIn: "1d" } // Masa berlaku token
           );
            res.status(200).json({success:true, token}) // Return success: true
        }
        else{
            return res.status(401).json({ success: false, message: "email atau password salah" });
        }

    } catch (error) {
      console.log(error);
      res.status(500).json({ success: false, message: error.message });
    }
  };

  export const adminLogin = async (req, res) => {
    try {
      const { email, password } = req.body;
  
      if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
        const token = jwt.sign({ email, password }, process.env.JWT_SECRET); // Payload for admin
        res.status(200).json({success: true, token }); // Return success: true
      } else {
        res.status(401).json({ success: false, message: "Kredensial salah" }); // 401 Unauthorized
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: error.message });
    }
  };