const express = require("express");
const router = express.Router();
const User = require("../models/User.model");
const { isAuthenticated } = require("../middleware/jwt.middleware");
const bcrypt = require ("bcrypt");
const jwt = require("jsonwebtoken");
const saltRounds = 10;




// POST to create new user:
router.post("/register", async (req, res) => {
    try {
        const { email, userName, firstName, lastName, password, confirmPassword } = req.body;

        console.log(req.body);

        if (
            email === "" ||
            userName === "" ||
            firstName === "" ||
            lastName === "" ||
            password === "" ||
            confirmPassword === ""
        ) {
            return res.status(400).json({ message: "Please provide missing information to complete your registration" });
        }

        // Check if email is valid
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: "Please enter a valid email address." });
        }

        // Check password length and complexity
        const passwordRegex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{3,}/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({
                message: "Password must have at least 3 characters and contain at least one uppercase letter, one lowercase letter, and one number."
            });
        }

        // Check if email is already registered
        const foundUser = await User.findOne({ email });
        if (foundUser) {
            return res.status(400).json({ message: "User is already registered, please login." });
        }

        // Hash the password
        const salt = bcrypt.genSaltSync(saltRounds);
        const hashedPassword = bcrypt.hashSync(password, salt);

        // Create new user in DB
        const createdUser = await User.create({ email, userName, firstName, lastName, password: hashedPassword });

        const { email: userEmail, userName: userUserName, _id } = createdUser;
        return res.status(201).json({ user: { userEmail, userUserName, _id } });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Error while creating user.", error: err.message });
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

        if(passwordCorrect) {
            const { _id, email, userName } = foundUser;
            const payload = { _id, email, userName };
            const authToken = jwt.sign(payload, process.env.TOKEN_SECRET, {
                algorithm: "HS256",
                expiresIn: "24h",
            });

            //send the token to the client
            //and the user info
            res.status(200).json({ authToken: authToken, userId: _id, userName: userName });

        }else {
            res.status(401).json({ message: "Cannot authenticate user. Please try again" });
        }   
    })

    .catch ((err) => res.status(500).json({ message: "Internal server error.", err }));
    

});


router.get("/verify", isAuthenticated, (req, res) => {
    console.log(`req.payload`, req.payload);

    res.status(200).json({ user: req.payload });
});


module.exports = router;

