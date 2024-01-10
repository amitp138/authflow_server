// /backend/routes/authRoutes.js

const express = require("express");
const sendSms = require("../twilio");
const nodemailer = require("nodemailer");
const OtpModel = require("../models/OtpModel");
const authController = require("../controllers/authController");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
require("dotenv").config();
const router = express.Router();

router.get("/", (req, res) => {
  res.send("authflow");
});
router.post("/register", authController.register);
router.post("/login", authController.login);

// Twilio route for sending SMS with OTP
router.post("/api/sentotp", async (req, res) => {
  const { to } = req.body;
  console.log(to);
  try {
    let otp;

    const existingRecord = await OtpModel.findOne({ mobileNumber: to });

    if (existingRecord) {
      otp = Math.floor(1000 + Math.random() * 9000).toString();
      await OtpModel.updateOne({ mobileNumber: to }, { otp });
    } else {
      otp = Math.floor(1000 + Math.random() * 9000).toString();
      await OtpModel.create({ mobileNumber: to, otp });
    }

    await sendSms(`+91${to}`, `Your login OTP is: ${otp}`);
    res.send(JSON.stringify({ success: true }));
  } catch (err) {
    console.error("Error sending OTP:", err);
    res.send(JSON.stringify({ success: false }));
  }
});

router.post("/api/verifyotp", async (req, res) => {
  const { to, enteredOtp } = req.body;

  try {
    const otpRecord = await OtpModel.findOne({
      mobileNumber: to,
      otp: enteredOtp,
    });

    res.send(JSON.stringify({ success: otpRecord !== null }));
  } catch (err) {
    console.error("Error verifying OTP:", err);
    res.send(JSON.stringify({ success: false }));
  }
});

router.post("/email/welcome", async (req, res) => {
  const { toemail, username } = req.body;
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: true,
    requireTLS: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    tls: {
      ciphers: "SSLv3",
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: toemail,
    subject: "Welcome message",
    text: `Hello ${username}, welcome to Authflow. We are excited to connect with you.`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.response);
    res.send(JSON.stringify({ success: true }));
  } catch (error) {
    console.error("Error sending welcome email:", error);
    res.send(JSON.stringify({ success: false }));
  }
});

function sendResetPasswordEmail(email, resetUrl) {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    tls: {
      ciphers: "SSLv3",
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Reset Your Password",
    text: `Click the following link to reset your password: ${resetUrl}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending reset password email:", error);
    } else {
      console.log("Reset password email sent:", info.response);
    }
  });
}

router.post("/reset-password", async (req, res) => {
  try {
    const { em } = req.body;
    const user = await User.findOne({ email: em });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    const resetUrl = `${process.env.RESET_URL_BASE}/${user._id}/${token}`;
    sendResetPasswordEmail(user.email, resetUrl);
    res.status(200).json({ message: "Reset password email sent successfully" });
  } catch (error) {
    console.error("Error sending reset password email:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/updatepass", async (req, res) => {
  try {
    const { pass, id, authtoken } = req.body;

    jwt.verify(authtoken, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(401).json({ error: "Invalid token" });
      }

      const user = await User.findOne({ _id: id });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const hashedPassword = await bcrypt.hash(pass, 10);
      user.password = hashedPassword;
      await user.save();

      res.json({ success: true });
    });
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
