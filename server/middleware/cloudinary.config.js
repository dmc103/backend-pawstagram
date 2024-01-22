const cloudinary = require("cloudinary").v2;

const { CloudinaryStorage } = require("multer-storage-cloudinary");

const multer = require("multer");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,

  // name of the folder in cloudinary
  folder: "pawstagram",
  allowedFormats: ["jpg", "png"],

  //adding in case other type of files need to be uploaded
  params: { resource_type: "raw" },
  filename: function (req, res, cb) {
    //the file on cloudinary will have the same name as the original file
    cb(null, res.originalname);
  },
});

module.exports = multer({ storage });
