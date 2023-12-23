// /backend/config/db.js
require("dotenv").config();

const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const mongoString = process.env.MONGODB_URI; // Use environment variable for the MongoDB connection string
    if (!mongoString) {
      throw new Error("MongoDB connection string is missing.");
    }

    await mongoose.connect(mongoString);

    console.log('MongoDB Connected');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
