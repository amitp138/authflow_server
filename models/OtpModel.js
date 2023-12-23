
const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  mobileNumber: { type: String, required: true },
  otp: { type: String, required: true },
});

const OtpModel = mongoose.model('Otp', otpSchema);

module.exports = OtpModel;
