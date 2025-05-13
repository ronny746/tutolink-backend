const mongoose = require("mongoose");

const SubjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  iconUrl: { type: String },
  classOrCourseId: { type: mongoose.Schema.Types.ObjectId, ref: "ClassOrCourse", required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Subject", SubjectSchema);
