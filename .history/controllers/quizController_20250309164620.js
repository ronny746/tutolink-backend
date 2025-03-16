const Quiz = require("../models/Quiz");
const Question = require("../models/questions");
const Subject = require("../models/Subject");

// ✅ Upload Quiz with Multiple Questions
exports.uploadQuiz = async (req, res) => {
  try {
    const { subjectId, questions, name, totalPoints, rating, duration, participants, averageScore, instructions } = req.body;

    if (!subjectId || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: "Subject ID and a valid list of questions are required" });
    }

    // ✅ Insert Questions
    const createdQuestions = await Question.insertMany(questions);

    // ✅ Create Quiz
    const quiz = new Quiz({
      subjectId,
      questions: createdQuestions.map(q => q._id), // Store Question IDs
      name,
      totalPoints,
      rating,
      totalQuestions: questions.length,
      duration,
      participants,
      averageScore,
      instructions
    });

    await quiz.save();

    res.status(201).json({ message: "Quiz uploaded successfully", quiz });
  } catch (error) {
    res.status(500).json({ error: "Error uploading quiz", details: error.message });
  }
};

// ✅ Get All Quizzes by Subject ID
exports.getQuizzes = async (req, res) => {
  try {
    const { subjectId } = req.query;
    if (!subjectId) return res.status(400).json({ error: "Subject ID is required" });

    // ✅ Find Subject
    const subject = await Subject.findById(subjectId).select("_id name description createdAt").lean();
    if (!subject) return res.status(404).json({ error: "Subject not found" });

    // ✅ Find Quizzes for this Subject
    const quizzes = await Quiz.find({ subjectId }).populate("questions").select("-subjectId -__v").lean();

    res.json({ message: "Quizzes fetched successfully", subject, quizzes });
  } catch (error) {
    res.status(500).json({ error: "Error fetching quizzes", details: error.message });
  }
};


exports.updateQuiz = async (req, res) => {
  try {
    const { quizId } = req.query; // Get quiz ID from URL
    const updateData = req.body; // Get updated fields from request body

    // Find and update the quiz
    const updatedQuiz = await Quiz.findByIdAndUpdate(
      quizId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    // If quiz not found
    if (!updatedQuiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    res.json({
      message: "Quiz updated successfully",
      quiz: updatedQuiz
    });
  } catch (error) {
    res.status(500).json({ error: "Error updating quiz", details: error.message });
  }
};


exports.getallQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find().select("name points duration instructions"); // Fetch specific fields

    res.json({
      message: "Quizzes fetched successfully",
      quizzes,
    });
  } catch (error) {
    res.status(500).json({ error: "Error fetching quizzes", details: error.message });
  }
};


// ✅ Delete Quiz
exports.deleteQuiz = async (req, res) => {
  try {
    const { quizId } = req.query;
    console.log(quizId);
    const quiz = await Quiz.findByIdAndDelete(quizId);
    if (!quiz) return res.status(404).json({ error: "Quiz not found" });

    res.json({ message: "Quiz deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting quiz", details: error.message });
  }
};

exports.getQuizById = async (req, res) => {
  try {
    const { quizId } = req.query;

    // Populate questions if they are referenced in the Quiz model
    const quiz = await Quiz.findById(quizId).populate("questions");

    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    res.json({
      message: "Quiz fetched successfully",
      quiz,
    });
  } catch (error) {
    res.status(500).json({ error: "Error fetching quiz", details: error.message });
  }
};



exports.submitQuiz = async (req, res) => {
  try {
    const { quizId, score } = req.body;
    const userId = req.user.id;  // ✅ Token से userId निकाल रहा है

    if (!quizId || score === undefined) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Find User
    let user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user already attempted the quiz
    const existingQuiz = user.quizzesTaken.find(q => q.quizId.toString() === quizId);

    if (existingQuiz) {
      // Update existing score
      existingQuiz.score = score;
      existingQuiz.dateTaken = new Date();
    } else {
      // Add new quiz attempt
      user.quizzesTaken.push({
        quizId,
        score,
        dateTaken: new Date(),
      });
    }

    // Save updated user data
    await user.save();

    res.json({ message: "Quiz submitted successfully", quizzesTaken: user.quizzesTaken });
  } catch (error) {
    console.error("Quiz Submission Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
