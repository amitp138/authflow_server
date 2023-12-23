const express = require("express");
const bodyParser = require("body-parser");
const connectDB = require("./config/db");
const passport = require("passport");
const authRoutes = require("./routes/authroutes");
require("dotenv").config();

const app = express();

// Connect to the database
connectDB();

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.json()); 
app.use(passport.initialize());

// Passport config
require("./config/passport")(passport);

// Routes
app.use(authRoutes);

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
