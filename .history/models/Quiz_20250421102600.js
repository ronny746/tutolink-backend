const mongoose = require("mongoose");


// 🔹 Quiz Schema
const QuizSchema = new mongoose.Schema({
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: false },
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }], // References to multiple questions
  name: { type: String, required: true }, // Total points for quiz
  totalPoints: { type: Number, default: 0 }, // Total points for quiz
  rating: { type: Number, default: 0 }, // User rating for quiz (0-5)
  totalQuestions: { type: Number, default: 0 }, // Total number of questions
  duration: { type: Number, default: 0 }, // Quiz duration in minutes
  participants: { type: Number, default: 0 }, // Number of participants
  averageScore: { type: Number, default: 0 }, // Average score of all participants
  instructions: [{ type: String, required: false }], // List of instructions
  startTime: { type: String, required: false },
  endTime: { type: String, required: false },
  status: { type: String, enum: ["Upcoming", "Live", "Ended"], default: "Upcoming" },
  createdAt: { type: Date, default: Date.now }
});


module.exports = mongoose.model("Quiz", QuizSchema);
