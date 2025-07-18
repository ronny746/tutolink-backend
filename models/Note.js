const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema({
  title: String,
  content: String,
  tags: [String],
});

// Enable text search on content
noteSchema.index({ content: "text" });

module.exports = mongoose.model("Note", noteSchema);
