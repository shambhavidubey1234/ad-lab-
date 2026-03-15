const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Send OTP email
const sendOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Email Verification OTP - EventHub',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #0B2838; border-radius: 8px;">
        <h2 style="color: #DBA858; text-align: center;">🎯 EventHub Email Verification</h2>
        <p style="color: #A0AEC0; font-size: 16px;">Your OTP for email verification is:</p>
        <div style="background: #031B28; padding: 15px; border-radius: 8px; text-align: center; border: 2px solid #8C0E0F;">
          <h1 style="color: #E89C31; font-size: 36px; letter-spacing: 5px; margin: 0;">${otp}</h1>
        </div>
        <p style="color: #A0AEC0; margin-top: 20px;">This OTP is valid for 10 minutes.</p>
        <p style="color: #DBA858; font-size: 14px;">If you didn't request this, please ignore this email.</p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendOTPEmail };