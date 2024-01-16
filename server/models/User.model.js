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
  
  profilepic: String,
  bio: String,
  country: String,
  followers: [],
  following: [],

}, 

{
  timestamps: true

});



const User = model("User", userSchema);

module.exports = User;
