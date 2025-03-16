const mongoose = require("mongoose");

const QuizSchema = new mongoose.Schema({
  subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
  question: { type: String, required: true },
  options: [{ type: String }],
  correctAnswer: { type: String, required: true }
});

module.exports = mongoose.model("Quiz", QuizSchema);
