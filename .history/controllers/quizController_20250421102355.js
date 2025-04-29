const Quiz = require("../models/Quiz");
const Question = require("../models/questions");
const Subject = require("../models/Subject");
const User = require("../models/User");
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
    const userId = req.user.id; 
    const { subjectId } = req.query;

    if (!subjectId) {
      return res.status(400).json({ error: "Subject ID is required" });
    }

    // ✅ Find User's Attempted Quizzes
    const user = await User.findById(userId).select("quizzesTaken");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ Find Subject
    const subject = await Subject.findById(subjectId)
      .select("_id name description createdAt")
      .lean();

    if (!subject) {
      return res.status(404).json({ error: "Subject not found" });
    }

    // ✅ Get all quizzes for this subject
    const quizzes = await Quiz.find({ subjectId }).select("_id name duration instructions");

    // ✅ Get attempted quiz IDs (Set for fast lookup)
    const attemptedQuizIds = new Set(user.quizzesTaken.map(q => q.quizId.toString()));

    // ✅ Add isPlay field: true for attempted quizzes, false otherwise
    const modifiedQuizzes = quizzes.map(quiz => ({
      ...quiz.toObject(),
      isPlay: attemptedQuizIds.has(quiz._id.toString()) // ✅ Mark as played or not
    }));

    res.json({ message: "Quizzes fetched successfully", subject, quizzes: modifiedQuizzes });

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
    const { quizId, score, answers } = req.body;
    const userId = req.user.id;

    if (!quizId || score === undefined || !answers || answers.length === 0) {
      return res.status(400).json({ message: "Quiz ID, score, and answers are required" });
    }

    let user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    let quizIndex = user.quizzesTaken.findIndex(q => q.quizId.toString() === quizId);

    if (quizIndex !== -1) {
      // ✅ Quiz already attempted, update answers properly
      let existingQuiz = user.quizzesTaken[quizIndex];

      answers.forEach((newAnswer) => {
        let questionIndex = existingQuiz.answers.findIndex(
          (ans) => ans.questionId.toString() === newAnswer.questionId
        );

        if (questionIndex !== -1) {
          // ✅ Replace old answer with new one
          existingQuiz.answers[questionIndex] = newAnswer;
        } else {
          // ✅ Add new question's answer
          existingQuiz.answers.push(newAnswer);
        }
      });

      // ✅ Recalculate the score
      user.points -= existingQuiz.score; // Remove old score
      existingQuiz.score = score; // Update with new score
    } else {
      // ✅ First time attempting this quiz, add new entry
      user.quizzesTaken.push({ quizId, score, answers });
    }

    // user.points -= existingQuiz.score; // Remove old score
    // existingQuiz.score = newScore; // Update new score
    // user.points += newScore; // Add updated score
    user.points = user.quizzesTaken.reduce((acc, quiz) => acc + quiz.score, 0);
    // user.points += score; // Update total points correctly
    await user.save();

    res.json({
      message: "Quiz submitted successfully",
      quizzesTaken: user.quizzesTaken, // ✅ Multiple quizzes data return karenge
    });

  } catch (error) {
    console.error("Submit Quiz Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};


exports.getQuizReview = async (req, res) => {
  try {
    const { quizId } = req.params; // Get quiz ID
    const userId = req.user.id; // Token se user ID extract

    // ✅ Find user
    let user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // ✅ Find user taken quiz
    let takenQuiz = user.quizzesTaken.find(q => q.quizId.toString() === quizId);
    if (!takenQuiz) return res.status(404).json({ message: "Quiz not found in user's history" });

    // ✅ Get all questions for this quiz
    let quiz = await Quiz.findById(quizId).populate("questions");
    let quizDetail = await Quiz.findById(quizId).select("name totalPoints rating duration  totalQuestions averageScore participants instructions ");

    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    // ✅ Prepare review data
    let review = quiz.questions.map((q, index) => ({
      questionId: q._id,
      question: q.question,
      options: q.options,
      selectedOption: takenQuiz.answers ? takenQuiz.answers[index] : null, // Store user's selected answers in DB
      correctAnswer: q.correctAnswer,
      explanation: q.explanation // ✅ Include Explanation
    }));

    res.json({ quizDetail, review });
  } catch (error) {
    console.error("Quiz Review Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};


exports.deleteUserTakenQuiz = async (req, res) => {
  try {
    const { quizId } = req.params; // Quiz ID from request
    const userId = req.user.id; // Token se user ID

    let user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // 🔹 Check if quiz exists in user's taken quizzes
    let quizIndex = user.quizzesTaken.findIndex(q => q.quizId.toString() === quizId);
    if (quizIndex === -1) {
      return res.status(404).json({ message: "Quiz attempt not found" });
    }

    // 🔹 Remove quiz attempt & update points
    let removedQuiz = user.quizzesTaken.splice(quizIndex, 1)[0];
    user.points -= removedQuiz.score; // Remove earned points

    await user.save();
    res.json({ message: "Quiz attempt deleted successfully", quizId });
  } catch (error) {
    console.error("Delete Quiz Attempt Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};



exports.quizResult = async (req, res) => {
  try {
    const { quizId } = req.params;
    const userId = req.user ? req.user.id : null; // Ensure userId exists

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized, user not found in request" });
    }

    // Fetch user attempt from quizzesTaken array
    const user = await User.findById(userId).populate("quizzesTaken.quizId");
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Find the specific quiz attempt
    const attempt = user.quizzesTaken.find(q => q.quizId._id.toString() === quizId);

    if (!attempt) {
      return res.status(404).json({ error: "Quiz attempt not found" });
    }

    // Fetch quiz details
    const quiz = attempt.quizId;

    // Calculate points
    const correctAnswers = attempt.answers.filter(a => a.selectedOption === a.correctAnswer).length;
    const wrongAnswers = attempt.answers.length - correctAnswers;
    const correctPoints = correctAnswers * 1;  // Example: 10 points per correct answer
    const wrongPoints = wrongAnswers * 0; // Example: -5 points per wrong answer
    const totalPoints = correctPoints + wrongPoints;

    res.json({
      message: "Quiz result fetched successfully",
      data: {
        id:quiz._id,
        title: quiz.name,
        rating: quiz.rating,
        completionTime: `Completed Quiz On ${new Date(attempt.dateTaken).toDateString()}`,
        attempted: {
          label: "Attempted",
          value: attempt.answers.length
        },
        correctAnswers: {
          label: "Correct Answers",
          value: correctAnswers,
          points: correctPoints
        },
        wrongAnswers: {
          label: "Wrong Answers",
          value: wrongAnswers,
          points: wrongPoints
        },
        overallPoints: {
          label: "Overall Points",
          value: totalPoints
        },
        additionalInfo: "This quiz is a contest type, so results will be declared after the contest ends.",
        solutionInfo: "This Quiz does not contain solutions",
        actions: [
          { label: "Review Answers", action: "/review-answers" },
          { label: "Play Again", action: "/play-again" }
        ]
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Error fetching quiz result", details: error.message });
  }
};

exports.openAiQuestions = async (req, res) => {
  try {
    const { subject, topic, numberOfQuestions, difficulty, startTime } = req.body;

    // 🔍 Validation
    if (!subject || !topic || !numberOfQuestions || !difficulty || !startTime) {
      return res.status(400).json({ error: "Missing required fields: subject, topic, numberOfQuestions, difficulty, startTime" });
    }

    // ✅ Prompt to AI model
    const prompt = `
    Generate a quiz on the topic "${topic}" under the subject "${subject}".
    Difficulty: "${difficulty}". Total Questions: ${numberOfQuestions}.
    Output the quiz strictly in this JSON format:

    {
      "subjectId": "random_generated_id_here",
      "name": "${topic}",
      "totalPoints": ${numberOfQuestions * 10},
      "rating": 0,
      "duration": ${numberOfQuestions * 2},
      "participants": 0,
      "averageScore": 0,
      "startTime": "${startTime}",
      "endTime": "${new Date(new Date(startTime).getTime() + numberOfQuestions * 2 * 60000).toISOString()}",
      "instructions": [
        "Test your knowledge on ${topic}!",
        "No negative marking."
      ],
      "questions": [
        {
          "question": "What is ...?",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswer": "A",
          "explanation": "Explanation about the correct answer.",
          "time": "2"
        }
        // ${numberOfQuestions} total
      ]
    }

    Only return raw JSON. No explanation, no notes.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = await response.text();

    // ✅ Clean output
    text = text.replace(/```json|```/g, "").trim();

    const quizData = JSON.parse(text);

    res.status(200).json({ success: true, quiz: quizData });

  } catch (error) {
    console.error("❌ Error generating quiz:", error.message);
    res.status(500).json({ error: "Error generating quiz" });
  }
};

