const mongoose = require("mongoose");

// 🔹 Question Schema
const QuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: String, required: true },
  explanation: { type: String, required: false },
  time: { type: Number, required: false }, // Time limit in seconds
  questionImage: { type: String, required: false }, // URL for question image
  explanationImage: { type: String, required: false }, // URL for explanation image
  createdAt: { type: Date, default: Date.now }
});

// 🔹 Quiz Schema
const QuizSchema = new mongoose.Schema({
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }], // References to multiple questions
  totalPoints: { type: Number, default: 0 }, // Total points for quiz
  rating: { type: Number, default: 0 }, // User rating for quiz (0-5)
  totalQuestions: { type: Number, default: 0 }, // Total number of questions
  duration: { type: Number, default: 0 }, // Quiz duration in minutes
  participants: { type: Number, default: 0 }, // Number of participants
  averageScore: { type: Number, default: 0 }, // Average score of all participants
  instructions: [{ type: String, required: false }], // List of instructions
  createdAt: { type: Date, default: Date.now }
});

const Question = mongoose.model("Question", QuestionSchema);
const Quiz = mongoose.model("Quiz", QuizSchema);

module.exports = { Question, Quiz };
