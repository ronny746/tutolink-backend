const mongoose = require("mongoose");

const QuizBattleSchema = new mongoose.Schema({
  player1: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  player2: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }],
  player1Score: { type: Number, default: 0 },
  player2Score: { type: Number, default: 0 },
  // New fields to store answers
  player1Answers: [
    {
      questionId: { type: mongoose.Schema.Types.ObjectId, ref: "Question" },
      answer: { type: String },
      isCorrect: { type: Boolean }
    }
  ],
  player2Answers: [
    {
      questionId: { type: mongoose.Schema.Types.ObjectId, ref: "Question" },
      answer: { type: String },
      isCorrect: { type: Boolean }
    }
  ],
  status: { type: String, enum: ["Pending", "Ongoing", "Completed"], default: "Pending" },
  winner: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("QuizBattle", QuizBattleSchema);
