const { Schema, model } = require("mongoose");

const friendsSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    follower: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    createdAt: {
      type: Date,
      default: Date.now
    }
  },

  {
    timestamps: true,
  }
  
);

const Friends = model("Friends", friendsSchema);

module.exports = Friends;
