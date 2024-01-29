// ℹ️ Gets access to environment variables/settings
// https://www.npmjs.com/package/dotenv
require("dotenv").config();

// ℹ️ Connects to the database
require("./db");

// Handles http requests (express is node js framework)
// https://www.npmjs.com/package/express
const express = require("express");

const app = express();

const cors = require("cors");

//to enable cors
app.use(
  cors({
    origin: ["http://localhost:5005", "http://localhost:5173"],
  })
);

// ℹ️ This function is getting exported from the config folder. It runs most pieces of middleware
require("./config")(app);

// 👇 Start handling routes here
const indexRoutes = require("./routes/index.routes");
app.use("/api", indexRoutes);
console.log("Here is the indexRoutes", indexRoutes);

const authRoutes = require("./routes/auth.routes");
app.use("/auth", authRoutes);
console.log("Here is the authRoutes", authRoutes);

const userRoutes = require("./routes/user.routes");
app.use("/user", userRoutes);
console.log("Here is the userRoutes", userRoutes);

const postRoutes = require("./routes/post.routes");
app.use("/posts", postRoutes);
console.log("Here is the postRoutes", postRoutes);

// ❗ To handle errors. Routes that don't exist or errors that you handle in specific routes
require("./error-handling")(app);

module.exports = app;
