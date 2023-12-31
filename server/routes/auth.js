const router = require("express").Router();
const User = require("../models/User");
const CryptoJS = require("crypto-js");
const jwt = require("jsonwebtoken");
const verifyToken = require("../verifyToken");

// Register
router.post("/register", async (req, res) => {
  const newUser = new User({
    username: req.body.username,
    email: req.body.email,
    password: CryptoJS.AES.encrypt(
      req.body.password,
      process.env.SECRET_KEY
    ).toString(),
  });

  try {
    const user = await newUser.save();
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json(err);
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({
      email: req.body.email,
    });
    if (user === null) {
      return res.status(401).json("User doesn't exist!");
    } else {
      const bytes = CryptoJS.AES.decrypt(user.password, process.env.SECRET_KEY);
      const originalPassword = bytes.toString(CryptoJS.enc.Utf8);
      if (originalPassword !== req.body.password) {
        return res.status(401).json("Wrong password ");
      } else {
        const { password, ...info } = user._doc;
        const accessToken = jwt.sign(
          { id: user._id, isAdmin: user.isAdmin },
          process.env.SECRET_KEY,
          { expiresIn: "7d" }
        );
        return res.status(200).json({ ...info, accessToken });
      }
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

// Forgot PAssword
router.post("/forgotPassword", async (req, res) => {
  try {
    const user1 = await User.findOne({
      email: req.body.email,
    });

    if (user1 === null) {
      return res.status(401).json("User doesn't exist!");
    } else {
      try {
        if (req.body.password) {
          req.body.password = CryptoJS.AES.encrypt(
            req.body.password,
            process.env.SECRET_KEY
          ).toString();
        }
        const updatedUser = await User.findByIdAndUpdate(
          user1.id,
          {
            $set: req.body,
          },
          { new: true }
        );
        res.status(200).json(updatedUser);
      } catch (err) {
        res.status(500).json(err);
      }
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
