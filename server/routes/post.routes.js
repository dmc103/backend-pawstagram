const express = require("express");
const router = express.Router();
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const jwt = require("jsonwebtoken");
const { isAuthenticated } = require("../middleware/jwt.middleware");
const Post = require("../models/Post.model");
const User = require("../models/User.model");

//create a post
router.post(
  "/create",
  isAuthenticated,
  upload.single("image"),
  async (req, res) => {
    try {
      let imageUrl = null;

      // file upload to cloudinary
      if (req.file) {
        const result = await cloudinary.uploader
          .upload_stream({
            resource_type: "raw",
          })
          .catch((error) => {
            res.status(500).json({ message: "Error uploading image" });
            return;
          });

        if (result) {
          imageUrl = result.url;
        } else {
          res.status(500).json({ message: "Error uploading image" });
          return;
        }
      }

      // to create a new post
      const newPost = new Post({
        ...req.body,
        userId: req.user._id,
        image: imageUrl,
      });

      const savedPost = await newPost.save();
      res.status(200).json(savedPost);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

//update a post
router.put("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (post.userId === req.body.userId) {
      await post.updateOne({ $set: req.body });
      res.status(200).json({ message: "The post has been updated" });
    } else {
      res.status(403).json({ message: "You can only update your post" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//delete a post
router.delete("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (post.userId === req.body.userId) {
      res.status(200).json({ message: "The post has been deleted" });
    } else {
      res.status(403).json({ message: "You can only delete your post" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//to like and dislike a post
router.put("/:id/like", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post.likes.includes(req.body.userId)) {
      await post.updatedOne({ $push: { likes: req.body.userId } });
      res.status(200).json({ message: "You liked the post!" });
    } else {
      await post.updatedOne({ $pull: { likes: req.body.userId } });
      res.status(200).json({ message: "You disliked the post!" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//get a post
router.get("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    res.status(200).json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//display all friends' posts in the timeline

router.get("/timeline/:userId", async (req, res) => {
  try {
    const currentUser = await User.findById(req.params.userId);

    if (!currentUser) {
      return res
        .status(404)
        .json({ message: "User not found, please try again" });
    }
    const userPosts = await Post.find({ userId: currentUser._id });

    if (!currentUser.followings || currentUser.followings.length === 0) {
      return res.json(userPosts);
    }

    const friendsPostsPromises = currentUser.followings.map((friendId) =>
      Post.find({ userId: friendId })
    );
    const friendsPosts = await Promise.all(friendsPostsPromises);

    res.json(userPosts.concat(...friendsPosts));
  } catch (error) {
    console.log("Error in /timeline/:userId:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;