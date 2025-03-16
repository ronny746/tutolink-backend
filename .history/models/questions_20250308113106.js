const mongoose = require("mongoose");

const QuizSchema = new mongoose.Schema({
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }], // Questions ko alag se ref kiya
  totalPoints: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  totalQuestions: { type: Number, default: 0 },
  duration: { type: Number, default: 0 },
  participants: { type: Number, default: 0 },
  averageScore: { type: Number, default: 0 },
  instructions: [{ type: String }], // Instructions as an array
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Quiz", QuizSchema);
