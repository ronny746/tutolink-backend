// models/Admin.js
const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
  adminId: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String },
  role: { type: String, default: "admin" },
});

module.exports = mongoose.model("Admin", adminSchema);
