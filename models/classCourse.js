const mongoose = require("mongoose");

const ClassOrCourseSchema = new mongoose.Schema({
  name: { type: String, required: true },  // e.g., "Class 6", "B.Tech", "NEET"
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("ClassOrCourse", ClassOrCourseSchema);
