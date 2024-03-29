const express = require("express");
const router = express.Router();
const User = require("../models/User.model");
const { isAuthenticated } = require("../middleware/jwt.middleware");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const saltRounds = 10;
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");

// POST to create new user:
router.post("/register", async (req, res) => {
  try {
    const { email, userName, firstName, lastName, password, confirmPassword } =
      req.body;

    console.log(req.body);

    if (
      email === "" ||
      userName === "" ||
      firstName === "" ||
      lastName === "" ||
      password === "" ||
      confirmPassword === ""
    ) {
      return res.status(400).json({
        message:
          "Please provide missing information to complete your registration",
      });
    }

    // Check if email is valid
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(email)) {
      return res
        .status(400)
        .json({ message: "Please enter a valid email address." });
    }

    // Check password length and complexity
    const passwordRegex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{3,}/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message:
          "Password must have at least 3 characters and contain at least one uppercase letter, one lowercase letter, and one number.",
      });
    }

    // Check if email is already registered
    const foundUser = await User.findOne({ email });
    if (foundUser) {
      return res
        .status(400)
        .json({ message: "User is already registered, please login." });
    }

    // Hash the password
    const salt = bcrypt.genSaltSync(saltRounds);
    const hashedPassword = bcrypt.hashSync(password, salt);

    // Create new user in DB
    const createdUser = await User.create({
      email,
      userName,
      firstName,
      lastName,
      password: hashedPassword,
    });

    const { email: userEmail, userName: userUserName, _id } = createdUser;
    return res.status(201).json({ user: { userEmail, userUserName, _id } });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: "Error while creating user.", error: err.message });
  }
});

// POST to login user:
router.post("/login", (req, res, next) => {
  const { email, password } = req.body;

  //check if email and password are provided
  if (email === "" || password === "") {
    res.status(400).json({ message: "Please provide email and password." });
    return;
  }

  //Check if the user exists in the DB
  User.findOne({ email })
    .then((foundUser) => {
      if (!foundUser) {
        res.status(401).json({ message: "Please register first." });
        return;
      }

      //compare password with hashed password
      const passwordCorrect = bcrypt.compareSync(password, foundUser.password);

      if (passwordCorrect) {
        const { _id, email, userName, country } = foundUser;
        const payload = { _id, email, userName, country };
        const authToken = jwt.sign(payload, process.env.TOKEN_SECRET, {
          algorithm: "HS256",
          expiresIn: "24h",
        });

        //send the token to the client
        //and the user info
        res.status(200).json({
          authToken: authToken,
          userId: _id,
          userName: userName,
          country: country,
        });
      } else {
        res
          .status(401)
          .json({ message: "Cannot authenticate user. Please try again" });
      }
    })

    .catch((err) =>
      res.status(500).json({ message: "Internal server error.", err })
    );
});

//to update online status
router.post("/user/status", async (req, res) => {
  const { userId, isOnline } = req.body;

  try {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { isOnline },
      { new: true }
    );

    res
      .status(200)
      .json({ message: "User status updated successfully", updatedUser });
  } catch (err) {
    res.status(500).json({ message: "Internal server error", err });
  }
});

router.get("/verify", isAuthenticated, (req, res) => {
  console.log(`req.payload`, req.payload);

  res.status(200).json({ user: req.payload });
});

//forgot password route
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const foundUser = await User.findOne({ email: email });
    if (!foundUser) {
      return res
        .status(404)
        .send({ message: "Email not found. Please check and try again." });
    }

    const token = jwt.sign({ id: foundUser._id }, process.env.TOKEN_SECRET, {
      algorithm: "HS256",
      expiresIn: "1d",
    });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    //to check if the transporter is working
    console.log("Here is the transporter", transporter);
    console.log({
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    });

    const mailOptions = {
      from: process.env.EMAIL_USERNAME,
      to: email,
      subject: "Reset your password",
      text: `Please click on the following link to reset your password: http://localhost:5173/reset-password/${foundUser._id}/${token}`,
    };

    //reset-password route

    router.post("/reset-password/:id/:token", (req, res) => {
      const { id, token } = req.params;
      const { password } = req.body;

      jwt.verify(token, process.env.TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(400).send({ message: "Error. Please try again." });
        } else {
          bcrypt
            .hash(password, saltRounds)
            .then((hashedPassword) => {
              User.findByIdAndUpdate({ _id: id }, { password: hashedPassword })
                .then((success) => res.send({ message: "Success" }))
                .catch((err) => res.send({ message: err }));
            })
            .catch((err) => {
              console.log(err);
            });
        }
      });
    });

    //new promise to send email
    await new Promise((resolve, reject) => {
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          reject(error);
        } else {
          resolve(info);
        }
      });
    });

    return res.send({
      message:
        "Password reset email sent successfully. Please check your inbox.",
    });
  } catch (err) {
    res
      .status(500)
      .send({ message: "An error occurred. Please try again later." });
    console.log("Error in /forgotPassword:", err);
  }
});

module.exports = router;
