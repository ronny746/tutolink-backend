const mongoose = require("mongoose");

const SubjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  pdfs: [{ filename: String, url: String }],
});

module.exports = mongoose.model("Subject", SubjectSchema);
