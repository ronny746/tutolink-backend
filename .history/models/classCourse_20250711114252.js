const mongoose = require("mongoose");

const ClassOrCourseSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g., "Class 6"
  color1: { type: String, required: false },
  color2: { type: String, required: false },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("ClassOrCourse", ClassOrCourseSchema);
