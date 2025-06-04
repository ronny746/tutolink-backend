const mongoose = require("mongoose");

const ClassOrCourseSchema = new mongoose.Schema({
  title: { type: String, required: true }, // e.g., "Class 6"
  color1: { type: [String], required: true }, // e.g., ["#C9F6CB", "#64CF69"]
  icon: { type: String, required: true }, // e.g., "assets/images/class6.png"
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("ClassOrCourse", ClassOrCourseSchema);
