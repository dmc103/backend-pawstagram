const express = require("express");
const router = express.Router();
const User = require("../models/User.model");



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
router.put('/:id', async (req, res) => {
    try {
        //check if user exists
        const user = await User.findById(req.params.id);
        const { _id, password} = req.body;

        if(user) {
            //update user
            const updatedUser = await User.findByIdAndUpdate(req.params.id, {
                $set: req.body,
            }, { new: true });

            return res.status(200).json(updatedUser);

        } else {
            return res.status(404).json({ message: "Sorry, user not found" });
        }

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});











module.exports = router;









