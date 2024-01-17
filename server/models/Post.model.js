const { Schema, model } = require("mongoose");


const postSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  location: String,
  description: String,
  picturePath: String, // URL from Cloudinary
  likes: {
    type: Map,
    of: Boolean,
    default: {}
  },


  comments: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    comment: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
    
  }],
  
}, { timestamps: true });



  const Post = model ("Post", postSchema);

 module.exports = Post;