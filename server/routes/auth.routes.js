const express = require("express");
const router = express.Router();
const User = require("../models/User.model");
const { isAuthenticated } = require("../middleware/jwt.middleware");
const bcrypt = require ("bcrypt");
const jwt = require("jsonwebtoken");
const saltRounds = 10;




// POST to create new user:
router.post("/register", (req, res) => {
    const { email, userName, firstName, lastName, password, confirmPassword } = req.body;

    console.log(req.body);

    if (email === "" || 
    userName === "" || 
    firstName === "" || 
    lastName === "" || 
    password === "" ||
    confirmPassword === "") {
        res.status (400).json({message: "Please provide missing information to complete your registration"});
        return;
    }



//to check if email is valid
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
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
            res.status(400).json({ message: "User is already registered, please login." });
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
            password: hashedPassword });
        
        })

        .then((createdUser) => {
            const { email, userName, _id } = createdUser;

            //created new user in DB
            const user = { email, userName, _id };

            res.status(201).json({user: user });
        })

        .catch((err) => {
            console.error(err);
            res.status(500).json({ message: "Error while creating user.", error: err.message });
        });
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
                expiresIn: "6h",
            });


            res.status(200).json({ authToken: authToken });
        }else {
            res.status(401).json({ message: "Cannot authenticate user." });
        }   
    })

    .catch ((err) => res.status(500).json({ message: "Internal server error.", err }));
    

});


router.get("/verify", isAuthenticated, (req, res) => {
    console.log(`req.payload`, req.payload);

    res.status(200).json({ user: req.payload });
});


module.exports = router;

