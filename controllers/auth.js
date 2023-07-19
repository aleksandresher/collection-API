const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const sendgridTransport = require("nodemailer-sendgrid-transport");
const crypto = require("crypto");

const { User } = require("../model/User");

const generateResetToken = () => {
  const token = crypto.randomBytes(20).toString("hex");
  return token;
};

const tranporter = nodemailer.createTransport(
  sendgridTransport({
    auth: {
      api_key: process.env.GRID_API_KEY,
    },
  })
);

exports.signup = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed.");
    error.statusCode = 422;
    error.data = errors.array();
    throw error;
  }
  const email = req.body.email;
  const name = req.body.name;
  const password = req.body.password;
  bcrypt
    .hash(password, 12)
    .then((hashedPw) => {
      const user = new User({
        email: email,
        password: hashedPw,
        name: name,
      });
      return user.save();
    })
    .then((result) => {
      const resetToken = generateResetToken();
      const resetTokenExpiration = Date.now() + 3600000;

      result.resetToken = resetToken;
      result.resetTokenExpiration = resetTokenExpiration;

      return result.save();
    })
    .then((result) => {
      res.status(201).json({ message: "User created!", userId: result._id });
      return tranporter.sendMail({
        to: email,
        from: "aleksandre.shervashidze.2@iliauni.edu.ge",
        subject: "Signup succeeded!",
        html: "<h1>You successfully signed up!</h1>",
      });
    })
    .catch((err) => {
      console.log(err);
    })

    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.login = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  let loadedUser;
  User.findOne({ email: email })
    .then((user) => {
      if (!user) {
        const error = new Error("A user with this email could not be found.");
        error.statusCode = 401;
        throw error;
      }

      if (!user.active) {
        const error = new Error("Your account is currently inactive.");
        error.statusCode = 401;
        throw error;
      }
      loadedUser = user;
      return bcrypt.compare(password, user.password);
    })
    .then((isEqual) => {
      if (!isEqual) {
        const error = new Error("Wrong password!");
        error.statusCode = 401;
        throw error;
      }

      loadedUser.lastLogin = new Date();
      return loadedUser.save();
    })
    .then(() => {
      const token = jwt.sign(
        {
          email: loadedUser.email,
          userId: loadedUser._id.toString(),
        },
        "secretkey",
        { expiresIn: "1h" }
      );
      let message = "Welcome";
      if (loadedUser.role === "admin") {
        message = "Admin!";
      }

      res.status(200).json({
        token: token,
        userId: loadedUser._id.toString(),
        message: message,
      }); /// neeed to take this on react
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.forgotPassword = async (req, res, next) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const resetToken = generateResetToken();
    const resetTokenExpiration = Date.now() + 3600000;

    user.resetToken = resetToken;
    user.resetTokenExpiration = resetTokenExpiration;

    await user.save();

    const resetPasswordLink = `http://localhost:3000/reset-password?token=${resetToken}`;

    await tranporter.sendMail({
      to: email,
      from: "aleksandre.shervashidze.2@iliauni.edu.ge",
      subject: "Password Reset",
      html: `
        <p>Hello,</p>
        <p>Please click the following link to reset your password:</p>
        <a href="${resetPasswordLink}">${resetPasswordLink}</a>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    });

    res
      .status(200)
      .json({ message: "Password reset link sent to your email." });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "An error occurred. Please try again later." });
  }
};

exports.resetPassword = async (req, res) => {
  const { token } = req.query;
  try {
    const user = await User.findOne({ resetToken: token });

    if (!user || user.resetTokenExpires < Date.now()) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }
    const hashedPassword = await bcrypt.hash(req.body.password, 12);
    user.password = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpires = undefined;
    await user.save();

    return res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Error resetting password:", error);
    return res
      .status(500)
      .json({ error: "An error occurred while resetting the password" });
  }
};
