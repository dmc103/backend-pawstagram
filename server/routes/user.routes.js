const express = require("express");
const router = express.Router();
const User = require("../models/User.model");
const { isAuthenticated } = require("../middleware/jwt.middleware");
const bcrypt = require ("bcrypt");



//get user from database
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        console.log(user);

        //to not send password to frontend
        if(user) {
            const { password, ...otherDetails } = user._doc;
            return res.status(200).json(otherDetails);

        } else {
            return res.status(404).json({ message: "Sorry, user not found" });
        }

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


//update user
router.patch('/:id/update', async ( req, res ) => {
    try {
        console.log("Here is the request body", req.body);

        //check if the user is the same as the one logged in
        //..otherUpdates means that we can update any other field 
        const { userName, firstName, lastName, password, ...otherUpdates } = req.body;
        const updateData = { ...otherUpdates };

        //check if user exists
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (userName) updateData.userName = userName;
        if (firstName) updateData.firstName = firstName;
        if (lastName) updateData.lastName = lastName;


        //check if password is provided
        //if yes, hashing it first before it gets updated
        if (password) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            updateData.password = hashedPassword;
        }

        //to update the user
        const updatedUser = await User.findByIdAndUpdate(req.params.id, {
            $set: updateData,
        }, { new: true }).select('-password'); //this is to exclude the password to be showing in the response

        return res.status(200).json(updatedUser);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }

});



//Delete user
router.delete('/:id/delete', isAuthenticated, async (req, res, next) => {
    try {
        const userToDelete = await User.findById(req.params.id);
        const requestingUser = req.auth._id;

        console.log("userToDelete", userToDelete);
        console.log("requestingUser", requestingUser);

        if (!userToDelete) {
            return res.status(404).json({ message: "User not found, please try again" });
        }

        //to check if the user is the same as the one logged in
        if (requestingUser !== userToDelete.id.toString()) {
            return res.status(401).json({ message: "Request denied, you are unauthorized to delete this user." });
        }

        await userToDelete.deleteOne();
        res.status(200).json({ message: "User deleted successfully" });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }

});





    






module.exports = router;









