const express = require("express");
const router = express.Router();
const Post = require("../models/Post.model");
const User = require("../models/User.model");
const { isAuthenticated } = require("../middleware/jwt.middleware");
const bcrypt = require ("bcrypt");


