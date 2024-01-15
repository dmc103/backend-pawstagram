const { Schema, model } = require("mongoose");

const commentSchema = new Schema(
    {
    firstName: { 
        type: String, 
        required: true },
    profilePic: { 
        type: String, 
        ref: 'User', 
        required: true },
    location: { 
        type: String, 
        required: true },
    },
    { timestamps: true }
);

const CommentModel = model("Comment", commentSchema);



module.exports = CommentModel;
