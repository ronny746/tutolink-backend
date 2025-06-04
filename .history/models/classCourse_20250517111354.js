const mongoose = require("mongoose");

const ClassOrCourseSchema = new mongoose.Schema({
  title: { type: String, required: true }, // e.g., "Class 6"
  color1: { type: String, required: true },
  color2: { type: String, required: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("ClassOrCourse", ClassOrCourseSchema);
