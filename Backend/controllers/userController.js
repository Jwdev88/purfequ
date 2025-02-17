// backend/controllers/userController.js
import validator from "validator";
import bcrypt from "bcrypt";
import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken";

// --- Helper Functions ---

// Create a JWT token.  This is used after successful login/registration.
const createToken = (id) => {
  return jwt.sign({ userId: id }, process.env.JWT_SECRET, { expiresIn: "1d" });
};

// --- Controller Functions ---

// 1. Update Profile
export const updateProfile = async (req, res) => {
  try {
    const userId = req.userId; // Get ID from authUser middleware
    const { name, email, currentPassword, newPassword, confirmNewPassword } = req.body;

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found", success: false });
    }

    // Update Name (if provided)
    if (name) {
      user.name = name;
    }

    // Update Email (if provided)
    if (email) {
      if (!validator.isEmail(email)) {
        return res.status(400).json({ message: "Invalid email format.", success: false });
      }
      // Check if the new email is already in use by *another* user.
      const emailExists = await userModel.findOne({ email, _id: { $ne: userId } });
      if (emailExists) {
        return res.status(400).json({ message: "Email already in use.", success: false });
      }
      user.email = email;
    }

    // Update Password (if provided)
    if (currentPassword && newPassword) {
      if (newPassword.length < 8) {
        return res.status(400).json({ message: "New password must be at least 8 characters.", success: false });
      }
      if (newPassword !== confirmNewPassword) {
        return res.status(400).json({ message: "New password and confirmation do not match.", success: false });
      }
      // Verify the current password before updating.
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: "Incorrect current password.", success: false });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      user.password = hashedPassword;
    }

    await user.save();
    res.json({ success: true, message: "Profile updated successfully.", user: { name: user.name, email: user.email } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error updating profile.", error: error.message });
  }
};

// 2. Add Address
export const addAddress = async (req, res) => {
    try {
        const userId = req.userId;  // Get ID from authUser middleware
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

        res.status(201).json({ success: true, message: 'Address added successfully', address: newAddress });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error adding address', error: error.message });
    }
};

// 3. Update Address
export const updateAddress = async (req, res) => {
    try {
        const userId = req.userId; // Get ID from authUser middleware
        const { addressId } = req.params;  // Get addressId from URL parameters
        const { firstName, lastName, email, phone, street, city, cityId, postalCode, province, provinceId } = req.body;

        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({success: false, message: 'User not found' });
        }

        // Find the address subdocument by its ID.
        const addressToUpdate = user.address.id(addressId);
        if (!addressToUpdate) {
            return res.status(404).json({success: false, message: 'Address not found' });
        }

      // Update fields (if provided)
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
        res.json({ success: true, message: 'Address updated successfully', address: addressToUpdate });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success:false, message: 'Error updating address', error: error.message });
    }
};

// 4. Delete Address
export const deleteAddress = async (req, res) => {
  try {
    const userId = req.userId; // Get ID from authUser middleware
    const { addressId } = req.params;

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

      // Remove the address subdocument using .pull().
      user.address.pull({ _id: addressId });
      await user.save();
      res.status(200).json({ success: true, message: "Address deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error deleting address", error: error.message });
  }
};

// 5. Get User Addresses
export const getAddresses = async (req, res) => {
  try {
    const userId = req.userId;  // Get ID from authUser middleware
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({success: false, message: "User not found" });
    }
    res.status(200).json({ success: true, addresses: user.address });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error get user address", error: error.message });
  }
};

// 6. Get User Data (Excluding Password)
export const getUser = async (req, res) => {
    try {
        const userId = req.userId;  // Get ID from authUser middleware
        // Find the user and exclude the 'password' field.
        const user = await userModel.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({success: false, message: "User not found" });
        }
        res.status(200).json({success: true, user});
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Error getting user data", error: error.message });
    }
};

// 7. Get Address by ID
export const getAddressById = async (req, res) => {
  try {
    const userId = req.userId; // Get ID from authUser middleware
    const { addressId } = req.params;

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ success:false, message: "User not found" });
    }

    // Find the address subdocument by its ID.
    const address = user.address.id(addressId);
    if (!address) {
      return res.status(404).json({success: false, message: "Address not found" });
    }

    res.status(200).json({ success: true, address });
  } catch (error) {
    console.error("Error fetching address:", error);
    res.status(500).json({ success: false, message: "Error fetching address", error: error.message });
  }
};

// --- Auth Functions ---

// Register a new user.
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if the email is already registered.
    const exists = await userModel.findOne({ email });
    if (exists) {
      return res.status(400).json({success: false, message: "Email already registered." });
    }

    // Validate email format.
    if (!validator.isEmail(email)) {
      return res.status(400).json({ success: false, message: "Invalid email format." });
    }
    // Validate password length.
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters." });
    }

    // Hash the password.
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a new user.
    const newUser = new userModel({
      name,
      email,
      password: hashedPassword,
    });

    const user = await newUser.save();
    // Create a JWT token for the new user.
    const token = createToken(user._id);
    res.status(201).json({success: true, token });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Registration failed", error: error.message });
  }
};

// Log in an existing user.
export const loginUser = async (req, res) => {
  try {
      const {email, password } = req.body;
      console.log("Login attempt for email:", email,password); // Debug: Log email being used to login

      // Find the user by email.
       // Find the user by email.
      const user = await userModel.findOne({ email });
      if (!user) {
          return res.status(401).json({ success: false, message: "Email tidak ditemukan" });
      }
      // Compare the entered password with the hashed password.
      const isMatch = await bcrypt.compare(password, user.password);

      if(isMatch){
           // Create a JWT token.
          const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
          );
          res.status(200).json({success:true, token})
      }
      else{
          return res.status(401).json({ success: false, message: "email atau password salah" });
      }

  } catch (error) {
    console.error(error); // Log the error for debugging.
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin login (separate from user login).
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if the provided credentials match the admin credentials.
    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
      const token = jwt.sign({ email, password }, process.env.JWT_SECRET); // Simple payload
      res.status(200).json({success: true, token });
    } else {
      res.status(401).json({ success: false, message: "Kredensial salah" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};