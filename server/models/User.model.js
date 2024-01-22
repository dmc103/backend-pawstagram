const { Schema, model } = require("mongoose");

const userSchema = new Schema({
  email: {
    type: String,
    required: [true, 'Email is required.'],
    unique: true,
    trim: true
  },
  
  password: {
    type: String,
    required: [true, 'Password is required.']
  },

  firstName: { 
    type: String,
    required: [true, 'First name is required.']
  },

  lastName: { 
    type: String,
    required: [true, 'Last name is required.']
  },

  userName: {
    type: String,
    required: [true, 'Username is required.'],
    unique: true
  },

  profilepic: {
    type: String,
    default: " "
  },

  bio: {
    type: String,
    default: " "
  },

  country: {
    type: String,
    default: " "
  },


  followers: [{
    type: Schema.Types.ObjectId,
    ref: "User",
    default: []
  }],

  following: [{
    type: Schema.Types.ObjectId,
    ref: "User",
    default: []
  }],

  pets: [{
    type: String,
    enum: ["dog", "cat", "fish", "rabbit", "bird", "star", "heart"],
    default: []
  }]
  
}, 

{
  timestamps: true

});



const User = model("User", userSchema);

module.exports = User;
