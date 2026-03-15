const User = require("../models/user");
const jwt = require("jsonwebtoken");
const { sendOTPEmail } = require('../utils/emailService');

// Generate JWT Token with ALL user data
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id,
      email: user.email,
      role: user.role,
      collegeId: user.collegeId,
      name: user.name
    }, 
    process.env.JWT_SECRET, 
    {
      expiresIn: "30d",
    }
  );
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = async (req, res) => {
  try {
    const { name, email, collegeId, phone, department, year, password, role, clubName } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      collegeId,
      phone,
      department,
      year,
      password,
      role: role || "student",
      clubName: role === "club_admin" ? clubName : undefined
    });

    // Generate OTP
    const otp = user.generateOTP();
    await user.save();

    // Send OTP via email
    try {
      await sendOTPEmail(email, otp);
      console.log(`✅ OTP email sent to ${email}`);
    } catch (emailError) {
      console.error('❌ Failed to send email:', emailError);
    }

    res.status(201).json({
      message: "User registered. OTP sent to email.",
      userId: user._id,
      email: user.email
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    if (user.otp !== otp) {
      return res.status(400).json({ error: "Invalid OTP" });
    }
    
    if (user.otpExpires < Date.now()) {
      return res.status(400).json({ error: "OTP expired" });
    }
    
    user.emailVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();
    
    const token = generateToken(user);
    
    res.json({
      message: "Email verified successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: true,
        collegeId: user.collegeId
      }
    });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
// @access  Public
exports.resendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Generate new OTP
    const otp = user.generateOTP();
    await user.save();
    
    // Send new OTP via email
    try {
      await sendOTPEmail(email, otp);
      console.log(`✅ New OTP sent to ${email}`);
    } catch (emailError) {
      console.error('❌ Failed to send email:', emailError);
    }
    
    res.json({
      message: "New OTP sent successfully"
    });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = async (req, res) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ 
        success: false,
        error: "Request body is empty or missing" 
      });
    }
    
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        error: "Please provide both email and password" 
      });
    }
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        success: false,
        error: "Invalid credentials" 
      });
    }
    
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false,
        error: "Invalid credentials" 
      });
    }
    
    // Check if email is verified
    if (!user.emailVerified) {
      return res.status(401).json({ 
        success: false,
        error: "Please verify your email first",
        needsVerification: true,
        email: user.email
      });
    }
    
    const token = generateToken(user);
    
    user.lastLogin = new Date();
    user.lastActive = new Date();
    await user.save();
    
    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        collegeId: user.collegeId
      }
    });
    
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ 
      success: false,
      error: "Server error" 
    });
  }
};