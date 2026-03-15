const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post("/register", authController.registerUser);

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP for email verification
// @access  Public
router.post("/verify-otp", authController.verifyOTP);

// @route   POST /api/auth/resend-otp
// @desc    Resend OTP
// @access  Public
router.post("/resend-otp", authController.resendOTP);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post("/login", authController.loginUser);

module.exports = router;