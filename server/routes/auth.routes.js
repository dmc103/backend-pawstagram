const express = require("express");
const router = express.Router();

const User = require("../models/User.model");

const { isAuthenticated } = require("../middleware/jwt.middleware");

const bcrypt = require ("bcrypt");

const jwt = require("jsonwebtoken");

const saltRounds = 10;

// POST to create new user:
router.post("/register", (req, res, next) => {
    const { email, userName, firstName, lastName, password } = req.body;

    console.log(req.body);

    if (email === "" || 
    userName === "" || 
    firstName === "" || 
    lastName === "" || 
    password === "") {
        res.status (400).json({message: "Please provide missing information to complete your registration"});
        return;
    }



//to check if email is valid
const emailRegex = /[^@ \t\r\n]+@[^@ \t\r\n]+\.[^@ \t\r\n]+/;
if (!emailRegex.test(email)) {
    res.status(400).json({ message: "Please enter a valid email address." });
    return;
}


//to check passwod length and minimum length
    const passwordRegex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{3,}/;
    if (!passwordRegex.test(password)) {
        res.status(400).json({
            message:
            "Password must have atleast 3 characters and contain at least one uppercase letter, one lowercase letter, and one number."
        });
        return;

    }

//to check if email is already registered
    User.findOne({ email })
    .then((foundUser) => {
        if (foundUser) {
            res.status(400).json({ message: "This email is already registered." });
            return;
        }

        //if email is new, hash the password
        const salt = bcrypt.genSaltSync(saltRounds);
        const hashedPassword = bcrypt.hashSync(password, salt);

        //create new user in DB
        return User.create({ email, 
            userName, 
            firstName, 
            lastName, 
            password: hashedPassword })

        .then((createdUser) => {
            const { email, userName, _id } = createdUser;

            //created new user in DB
            const user = { email, userName, _id };

            res.status(201).json({user: user });
        })

        .catch((err) => {
            res.status(500).json({ message: "Error while creating user.", err });
        });
    })






});
