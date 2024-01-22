const { Schema, model } = require("mongoose");

const friendsSchema = new Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    lastName: {
      type: String,
      required: true,
    },

    profilePic: {
      type: String,
      required: true,
      ref: "User",
    },

    location: {
      type: String,
      required: [true, "Last name is required."],
    },
  },
  {
    timestamps: true,
  }
);

const Friends = model("Friends", friendsSchema);

module.exports = Friends;
