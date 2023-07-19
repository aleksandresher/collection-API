require("dotenv").config();
const mongoose = require("mongoose");
console.log(`process: ${process.env.DATABASE_URI}`);

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URI, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
      user: process.env.DATABASE_USERNAME,
      pass: process.env.DATABASE_PASSWORD,
      authSource: "admin",
    });
  } catch (err) {
    console.error(err);
  }
};

module.exports = connectDB;
