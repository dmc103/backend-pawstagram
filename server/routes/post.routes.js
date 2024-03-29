const express = require("express");
const router = express.Router();
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const jwt = require("jsonwebtoken");
const { isAuthenticated } = require("../middleware/jwt.middleware");
const Post = require("../models/Post.model");
const User = require("../models/User.model");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
  secure: true,
});

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
        const result = await new Promise((resolve, reject) => {
          let stream = cloudinary.uploader.upload_stream(
            { resource_type: "raw" },
            function (error, result) {
              if (error) {
                reject(error);
              } else {
                resolve(result);
              }
            }
          );
          streamifier.createReadStream(req.file.buffer).pipe(stream);
        });

        imageUrl = result.secure_url;
      }

      console.log("req.auth:", req.auth);

      // to create a new post
      const newPost = new Post({
        userId: req.auth && req.auth._id,
        img: imageUrl,
        desc: req.body.desc,
        likes: [],
      });

      //   console.log("this is the re.body:", req.body);

      const savedPost = await newPost.save();

      console.log("this is the saved post:", savedPost);

      res.status(200).json(savedPost);
    } catch (error) {
      res.status(500).json({ message: error.message });
      console.log(error);
    }
  }
);

//route to fetch all posts
router.get("/all", async (req, res) => {
  try {
    const posts = await Post.find()

      .populate("userId", "userName profilepic")
      .sort({ createdAt: -1 });
    console.log("here are the posts:", posts);
    res.json(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ message: error.message });
  }
});

// //update a post
// router.put("/:id", async (req, res) => {
//   try {
//     const post = await Post.findById(req.params.id);
//     if (post.userId === req.body.userId) {
//       await post.updateOne({ $set: req.body });
//       res.status(200).json({ message: "The post has been updated" });
//     } else {
//       res.status(403).json({ message: "You can only update your post" });
//     }
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });

// //delete a post
// router.delete("/:id", async (req, res) => {
//   try {
//     const post = await Post.findById(req.params.id);
//     if (!post.likes.includes(req.body.userId)) {
//       // if the user hasn't liked the post yet, add their ID to the likes array
//       await post.updateOne({ $push: { likes: req.body.userId } });
//       res.status(200).json({ message: "You liked the post!" });
//     } else {
//       // if the user has already liked the post, remove their ID from the likes array
//       await post.updateOne({ $pull: { likes: req.body.userId } });
//       res.status(200).json({ message: "You disliked the post!" });
//     }
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });

// // to like and dislike a post
// router.put("/:id/like", async (req, res) => {
//   try {
//     const userId = req.body.userId;
//     const postId = req.params.id;

//     const post = await Post.findById(postId);

//     if (!post) {
//       return res.status(404).json({ message: "Post not found" });
//     }

//     // to check if the user has already liked the post
//     const index = post.likes.indexOf(userId);

//     if (index === -1) {
//       //if not, adding the user's ID to the likes array
//       post.likes.push(userId);
//       await post.save();
//       res.status(200).json({
//         message: "You liked the post!",
//         likesCount: post.likes.length,
//       });
//     } else {
//       //however if already liked, remove the user's ID from the likes array
//       post.likes.splice(index, 1);
//       await post.save();
//       res.status(200).json({
//         message: "You disliked the post!",
//         likesCount: post.likes.length,
//       });
//     }
//   } catch (error) {
//     console.error("Error in /:id/like:", error);
//     res.status(500).json({ message: error.message });
//   }
// });

//to like and dislike a post
router.put("/:id/like", isAuthenticated, async (req, res) => {
  try {
    const userId = req.body.userId;
    // console.log("UserId to like post:", userId);

    const postId = req.params.id;
    const post = await Post.findById(postId);
    console.log("Post before liking:", post);

    const index = post.likes.indexOf(userId);
    if (index === -1) {
      post.likes.push(userId);
    } else {
      post.likes.splice(index, 1);
    }

    const savedPost = await post.save();
    // console.log("Post after liking and saving:", savedPost);

    const updatedPost = await Post.findById(postId)
      .populate("likes", "userName profilepic")
      .exec();

    // console.log("Post after populating likes:", updatedPost);

    res.status(200).json(updatedPost);
  } catch (error) {
    console.error("Error in /:id/like:", error);
    res.status(500).json({ message: error.message });
  }
});

//to comment on a post
router.post("/:id/comments", isAuthenticated, async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];
  console.log(token);
  try {
    const { text, userName, profileImageUrl } = req.body;
    const userId = req.auth._id;

    if (!userId) {
      console.log("userId:", userId);
      return res.status(401).json({ message: "Authentication is required" });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const comment = {
      userId,
      text,
      userName,
      profileImageUrl,
      createdAt: new Date(),
    };
    console.log("comment:", comment);

    post.comments.push(comment);
    await post.save();

    res.status(200).json({ comment, message: "Comment added successfully" });
  } catch (error) {
    console.error("Error in /:id/comments:", error);
    console.log("Error in /:id/comments:", error);
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

//display all user's posts in the timeline
router.get("/timeline/:userId", async (req, res) => {
  try {
    const currentUser = await User.findById(req.params.userId);

    if (!currentUser) {
      return res
        .status(404)
        .json({ message: "User not found, please try again" });
    }
    const userPosts = await Post.find({ userId: currentUser._id });

    if (!currentUser.following || currentUser.following.length === 0) {
      return res.json(userPosts);
    }

    const friendsPostsPromises = currentUser.following.map((friendId) =>
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
