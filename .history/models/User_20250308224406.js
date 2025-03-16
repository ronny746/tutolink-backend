const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  googleId: { type: String, unique: true },
  points: { type: Number, default: 0 },
});

module.exports = mongoose.model("User", UserSchema);
