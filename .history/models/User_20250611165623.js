const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String }, // If using email/password login
  googleId: { type: String, unique: true, sparse: true },
  avatar: { type: String }, // Profile picture URL
  role: { type: String, enum: ["student", "teacher", "admin"], default: "student" },
  points: { type: Number, default: 0 },
  rank: { type: Number, default: 0 }, // ✅ Rank Field Added
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category" }, 
  classOrCourseId: [{ type: mongoose.Schema.Types.ObjectId, ref: "ClassOrCourse" }], 
  selectedSubjects: [{ type: mongoose.Schema.Types.ObjectId, ref: "Subject" }], 
  quizzesTaken: [
    {
      quizId: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz" },
      score: Number,
      totalPoints: Number,
      dateTaken: { type: Date, default: Date.now },
      completionTime: Number,  // 🕒 Time taken to complete (in seconds)
      answers: [
        {
          questionId: { type: mongoose.Schema.Types.ObjectId, ref: "Question" },
          selectedOption: String,  // User's selected answer
          correctAnswer: String    // Correct answer for comparison
        }
      ]
    }
  ]
  ,
  progress: [
    {
      date: { type: Date, default: Date.now },
      pointsEarned: Number,
      reason: String
    }
  ],
  attendance: [
    {
      date: { type: Date, default: Date.now },
      status: { type: String, enum: ["Present", "Absent"], default: "Present" }
    }
  ],
  bookmarkedQuizzes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Quiz" }],
  favoriteSubjects: [{ type: String }],
  badges: [{ type: String }], // Earned achievements

  subscriptionStatus: { type: String, enum: ["Free", "Premium"], default: "Free" },
  dailyScore: { type: Number, default: 0 },
  lastCheckIn: { type: Date, default: null }
  
});

module.exports = mongoose.model("User", UserSchema);
