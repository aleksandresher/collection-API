const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cloudinary = require("cloudinary");
require("dotenv").config();
const connectDB = require("./config/dbConnection");

connectDB();

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const adminRoutes = require("./routes/admin");
const collectionRoutes = require("./routes/collection");

const app = express();

app.use(express.json());
app.use(cors());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "OPTIONS, GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});
app.use("/collections", collectionRoutes);
app.use("/users", userRoutes);
app.use("/admin", adminRoutes);
app.use("/", authRoutes);

app.use((error, req, res, next) => {
  console.log(error);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "OPTIONS, GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  const status = error.statusCode || 500;
  const message = error.message;
  const data = error.data;
  res.json({ message: message, data: data });
});

mongoose.connection.once("open", () => {
  console.log("Connected to MongoDB");
  const server = app.listen(8080);
  const io = require("./socket").init(server);

  io.on("connection", (socket) => {
    console.log("client connected");
  });
});
