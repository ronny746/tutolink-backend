const mongoose = require("mongoose");

const ContentSchema = new mongoose.Schema({
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
  title: { type: String, required: true },
  pdfUrl: { type: String, required: true },
  videoUrl: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Content", ContentSchema);
