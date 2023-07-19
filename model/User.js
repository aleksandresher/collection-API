const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const itemSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },

    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    likeCount: {
      type: Number,
      default: 0,
    },
    comments: [
      {
        content: {
          type: String,
          required: true,
        },
        author: {
          type: String,
          required: true,
        },
      },
    ],
    dynamicFields: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { strict: false }
);

const collectionSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  // author: {
  //   type: String,
  //   required: true,
  // },
  image: {
    type: String,
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  ratings: [
    {
      user: { type: Schema.Types.ObjectId, ref: "User" },
      rating: { type: Number, min: 1, max: 5 },
    },
  ],
  items: [itemSchema],
  dynamicFields: {
    type: Schema.Types.Mixed,
    default: {},
  },
  colauthor: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
});

const userSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  active: {
    type: Boolean,
    default: true,
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  resetToken: {
    type: String,
  },
  resetTokenExpiration: {
    type: Date,
  },

  collections: [{ type: Schema.Types.ObjectId, ref: "Collection" }],
});
userSchema.index({ items: "text" });

const User = mongoose.model("User", userSchema, "users");
const Collection = mongoose.model("Collection", collectionSchema);
const Item = mongoose.model("Item", itemSchema);

module.exports = { User, Collection, Item };
