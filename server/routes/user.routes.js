const express = require("express");
const router = express.Router();
const User = require("../models/User.model");
const { isAuthenticated } = require("../middleware/jwt.middleware");
const bcrypt = require("bcrypt");
const Post = require("../models/Post.model");

//to update online status
router.post("/status", async (req, res) => {
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

//get user from database
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    console.log(user);

    //to not send password to frontend
    if (user) {
      const { password, ...otherDetails } = user._doc;
      return res.status(200).json(otherDetails);
    } else {
      return res.status(404).json({ message: "Sorry, user not found" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// // user/upload
// // receives the image, sends it to Cloudinary via the fileUploader and returns the image URL
// router.post("/upload", fileUploader.single("profilepic")),
//   (req, res, next) => {
//     if (req.file) {
//       next(new Error("No file uploaded!"));

//       return;
//     }
//   };

// // Get the URL of h

//update user
router.patch("/:id/update", async (req, res) => {
  try {
    console.log("Here is the request body", req.body);

    //check if the user is the same as the one logged in
    //..otherUpdates means that we can update any other field
    const { userName, firstName, lastName, password, ...otherUpdates } =
      req.body;
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
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        $set: updateData,
      },
      { new: true }
    ).select("-password"); //this is to exclude the password to be showing in the response

    return res.status(200).json(updatedUser);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//delete user
router.delete("/:id/delete", isAuthenticated, async (req, res, next) => {
  try {
    const userToDelete = await User.findById(req.params.id);
    const requestingUser = req.auth._id;

    console.log("userToDelete", userToDelete);
    console.log("requestingUser", requestingUser);

    if (!userToDelete) {
      return res
        .status(404)
        .json({ message: "User not found, please try again" });
    }

    //to check if the user is the same as the one logged in
    if (requestingUser !== userToDelete.id.toString()) {
      return res.status(401).json({
        message: "Request denied, you are unauthorized to delete this user.",
      });
    }

    await userToDelete.deleteOne();
    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//route to follow another user
router.put("/:id/follow", isAuthenticated, async (req, res) => {
  const userId = req.auth._id;
  const userToFollowId = req.params.id;

  //check if the user is the same as the one logged in
  if (userId === userToFollowId) {
    return res
      .status(400)
      .json({ message: "Action is not valid, you cannot follow yourself" });
  }

  try {
    const user = await User.findById(userId);
    const userToFollow = await User.findById(userToFollowId);

    //if both users do not exist
    if (!user || !userToFollow) {
      return res
        .status(404)
        .json({ message: "User not found, please try again" });
    }

    //check if the user is already following the other user
    if (user.following.includes(userToFollowId)) {
      return res
        .status(400)
        .json({ message: "You are already following this user" });
    }

    //if not, then add the user to the following array
    user.following.push(userToFollowId);
    userToFollow.followers.push(userId);

    await user.save();
    await userToFollow.save();

    res.status(200).json({ message: "User has been followed successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//route to unfollow another user
router.post("/:id/unfollow", isAuthenticated, async (req, res) => {
  const userId = req.auth._id;
  const userToUnfollowId = req.params.id;

  //check if the user is the same as the one logged in
  if (userId === userToUnfollowId) {
    return res
      .status(400)
      .json({ message: "Action is not valid, you cannot unfollow yourself" });
  }

  try {
    const user = await User.findById(userId);
    const userToUnfollow = await User.findById(userToUnfollowId);

    //check if both users exist
    if (!user || !userToUnfollow) {
      return res
        .status(404)
        .json({ message: "User not found, please try again" });
    }

    //check if the user is already following the other user
    if (user.following.includes(userToUnfollowId)) {
      return res
        .status(400)
        .json({ message: "You are not following this user" });
    }

    //remove the userToUnffollowId from the following array
    user.following = user.following.filter(
      (id) => id.toStrng() !== userToUnfollowId
    );

    //remove the userId from the userToUnfollow's followers array
    userToUnfollow.followers = userToUnfollow.followers.filter(
      (id) => id.toStrng() !== userId
    );

    await user.save();
    await userToUnfollow.save();

    res.status(200).json({ message: "User has been unfollowed successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//endpoint to fetch all posts of a user
router.get("/:id/posts", async (req, res) => {
  try {
    const userId = req.params.id;
    const posts = await Post.find({ user: userId }).populate(
      "user",
      "username"
    );
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
