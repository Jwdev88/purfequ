import validator from "validator";
import bcrypt from "bcrypt";
import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken";

const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET);
};

//route user login
const loginUser = async (req, res) => {
  try {
    
    const {email, password } = req.body;
    const user = await userModel.findOne({ email });
    if (!user) {
        return res.json({ success: false, message: "Invalid credentials : Email not  exists" });
        
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
        return res.json({ success: false, message: "invalid email or password" });
    }

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

//route user register
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    //cek user ready
    const exists = await userModel.findOne({ email });

    if (exists) {
      return res.json({ success: false, message: "Email already exists" });
    }
    //validasi email dan strong password
    if (!validator.isEmail(email)) {
      return res.json({
        success: false,
        message: "Please enter a valid email",
      });
    }
    if (password.length < 8) {
      return res.json({
        success: false,
        message: "Password must be at least 8 characters long",
      });
    }

    //hasing user password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new userModel({
      name,
      email,
      password: hashedPassword,
    });

    const user = await newUser.save();

    const token = createToken(user._id);

    res.json({ success: true, token });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};
//route admin login
const adminLogin = async (req, res) => {
  try {
    const {email,password } = req.body

    if(email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD){
      const token = jwt.sign(email+password,process.env.JWT_SECRET);
      res.json({success:true,token})
    }
    else{
      res.json({success:false,message:"Invalid credentials"})
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
    
  }
}

export { loginUser, registerUser, adminLogin };