// __tests__/authController.test.js

import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import validator from 'validator';
import { loginUser, registerUser, adminLogin } from '../controllers/userController' // Sesuaikan path!
import userModel from '../models/userModel';

// Mock dependencies
jest.mock('jsonwebtoken');
jest.mock('bcrypt');
jest.mock('validator');
jest.mock('../models/userModel'); // Mock model User

describe('userController', () => {

  // --- loginUser ---
  describe('loginUser', () => {
    let req;
    let res;

    beforeEach(() => {
      // Reset mocks sebelum setiap test
      jest.clearAllMocks();

      // Mock request dan response objects
      req = {
        body: {},
      };
      res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(), // Untuk chaining, misal: res.status(400).json(...)
      };
    });

    it('should login a user successfully', async () => {
      req.body = { email: 'test@example.com', password: 'password123' };
      const mockUser = { _id: 'user123', email: 'test@example.com', password: 'hashedpassword' };

      userModel.findOne.mockResolvedValue(mockUser); // Mock findOne
      bcrypt.compare.mockResolvedValue(true); // Mock bcrypt.compare
      jwt.sign.mockReturnValue('mocked_jwt'); // Mock jwt.sign

      await loginUser(req, res);

      expect(userModel.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedpassword');
      expect(jwt.sign).toHaveBeenCalledWith({ userId: 'user123' }, process.env.JWT_SECRET, { expiresIn: '1d' });
      expect(res.json).toHaveBeenCalledWith({ success: true, token: 'mocked_jwt' });
    });

    it('should return an error if email is not found', async () => {
      req.body = { email: 'notfound@example.com', password: 'password123' };
      userModel.findOne.mockResolvedValue(null); // No user found

      await loginUser(req, res);

      expect(userModel.findOne).toHaveBeenCalledWith({ email: 'notfound@example.com' });
      expect(bcrypt.compare).not.toHaveBeenCalled(); // bcrypt.compare tidak boleh dipanggil
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Email tidak ditemukan' });
    });

    it('should return an error if password is incorrect', async () => {
      req.body = { email: 'test@example.com', password: 'wrongpassword' };
      const mockUser = { _id: 'user123', email: 'test@example.com', password: 'hashedpassword' };

      userModel.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false); // Password mismatch

      await loginUser(req, res);

      expect(userModel.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(bcrypt.compare).toHaveBeenCalledWith('wrongpassword', 'hashedpassword');
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'email atau password salah' });
    });

    it('should handle database errors', async () => {
      req.body = { email: 'test@example.com', password: 'password123' };
      userModel.findOne.mockRejectedValue(new Error('Database error'));

      await loginUser(req, res);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Database error' });
    });
  });

  // --- registerUser ---
  describe('registerUser', () => {
      let req;
      let res;

      beforeEach(() => {
        // Reset mocks sebelum setiap test
        jest.clearAllMocks();

        // Mock request dan response objects
        req = {
          body: {},
        };
        res = {
          json: jest.fn(),
          status: jest.fn().mockReturnThis(), // Untuk chaining, misal: res.status(400).json(...)
        };
      });
    it('should register a new user successfully', async () => {
        req.body = {name: "New User", email: "[email protected]", password: "SecurePassword123"};

        userModel.findOne.mockResolvedValue(null); // User not exists
        validator.isEmail.mockReturnValue(true); // Email valid
        bcrypt.genSalt.mockResolvedValue("salt");
        bcrypt.hash.mockResolvedValue("hashedPassword");
        const mockUser = { _id: 'newUser123', ...req.body, password: 'hashedPassword' };
        userModel.prototype.save.mockResolvedValue(mockUser); //new userModel.save()
        jwt.sign.mockReturnValue("mockedToken");

        await registerUser(req,res);
        expect(userModel.findOne).toHaveBeenCalledWith({email: req.body.email});
        expect(validator.isEmail).toHaveBeenCalledWith(req.body.email);
        expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
        expect(bcrypt.hash).toHaveBeenCalledWith(req.body.password, "salt");
        expect(userModel.prototype.save).toHaveBeenCalled(); //new userModel.save()
        expect(jwt.sign).toHaveBeenCalledWith({userId: "newUser123"}, process.env.JWT_SECRET, {expiresIn: "1d"});
        expect(res.json).toHaveBeenCalledWith({success: true, token: "mockedToken"});
    });

    it('should return an error if email already exists', async() => {
        req.body = {name: "New User", email: "[email protected]", password: "SecurePassword123"};
        userModel.findOne.mockResolvedValue({_id: "user1", ...req.body}); //User exists

        await registerUser(req, res);
        expect(userModel.findOne).toHaveBeenCalledWith({email: req.body.email});
        expect(res.json).toHaveBeenCalledWith({success: false, message: "Email sudah digunakan"});
    });

    it('Should return error if email is not valid', async() => {
        req.body = {name: "New User", email: "invalid-email", password: "SecurePassword123"};
        userModel.findOne.mockResolvedValue(null);
        validator.isEmail.mockReturnValue(false);

        await registerUser(req, res);
        expect(res.json).toHaveBeenCalledWith({success: false, message: "Email tidak valid"});
    });

    it('should return error if password length is less than 8', async()=> {
        req.body = {name: "New User", email: "[email protected]", password: "short"};
        userModel.findOne.mockResolvedValue(null);
        validator.isEmail.mockReturnValue(true);

        await registerUser(req,res);
        expect(res.json).toHaveBeenCalledWith({success: false, message: "Password minimal 8 karakter"});
    });

    it('should handle database error', async() => {
        req.body = {name: "New User", email: "[email protected]", password: "SecurePassword123"};
        userModel.findOne.mockRejectedValue(new Error("Database Error"));

        await registerUser(req, res);
        expect(res.json).toHaveBeenCalledWith({success:false, message: "Database Error"});
    });
  });

  // --- adminLogin ---
    describe('adminLogin', () => {
        let req;
        let res;

        beforeEach(() => {
          // Reset mocks
          jest.clearAllMocks();
          req = { body: {} };
          res = { json: jest.fn() };
        });
    it('should login admin with valid credentials', async () => {
        req.body = {email: "admin@example.com", password: "adminpassword"};
        process.env.ADMIN_EMAIL = "admin@example.com"; // Set environment variables
        process.env.ADMIN_PASSWORD = "adminpassword";
        jwt.sign.mockReturnValue('mockedTokenAdmin');
        await adminLogin(req,res);

        expect(jwt.sign).toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith({success: true, token: "mockedTokenAdmin"});
    });

    it('Should return error if admin credentials are wrong', async () => {
        req.body = {email: "admin@example.com", password: "wrongpassword"};
        process.env.ADMIN_EMAIL = "admin@example.com";
        process.env.ADMIN_PASSWORD = "adminpassword";

        await adminLogin(req,res);
        expect(res.json).toHaveBeenCalledWith({success: false, message: "Kredensial salah"});
    });

  });
});