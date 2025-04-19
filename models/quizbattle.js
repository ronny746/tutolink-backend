const mongoose = require("mongoose");

// const QuizBattleSchema = new mongoose.Schema({
//   player1: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
//   player2: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
//   questions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }],
//   player1Score: { type: Number, default: 0 },
//   player2Score: { type: Number, default: 0 },
//   // New fields to store answers
//   player1Answers: [
//     {
//       questionId: { type: mongoose.Schema.Types.ObjectId, ref: "Question" },
//       answer: { type: String },
//       isCorrect: { type: Boolean }
//     }
//   ],
//   player2Answers: [
//     {
//       questionId: { type: mongoose.Schema.Types.ObjectId, ref: "Question" },
//       answer: { type: String },
//       isCorrect: { type: Boolean }
//     }
//   ],
//   status: { type: String, enum: ["Pending", "Ongoing", "Completed"], default: "Pending" },
//   winner: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
//   createdAt: { type: Date, default: Date.now }
// });

// module.exports = mongoose.model("QuizBattle", QuizBattleSchema);

const BattleSchema = new mongoose.Schema({
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true }, // Reference to the Quiz
  battleCode: { type: String, unique: true, required: true }, // Unique battle code for sharing
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Creator of the battle
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Users who joined the battle
  startTime: { type: Date, required: true }, // When the battle starts
  endTime: { type: Date }, // Computed based on quiz duration
  status: { type: String, enum: ["Upcoming", "Live", "Ended"], default: "Upcoming" }, // Battle status
  scores: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      score: { type: Number, default: 0 },
      completedAt: { type: Date } // When user finished the quiz
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

// 🔹 Pre-save middleware to calculate endTime
BattleSchema.pre("save", async function (next) {
  if (this.isNew) {
    const quiz = await mongoose.model("Quiz").findById(this.quizId);
    if (quiz) {
      this.endTime = new Date(this.startTime.getTime() + quiz.duration * 60000);
    }
  }
  next();
});

module.exports = mongoose.model("Battle", BattleSchema);