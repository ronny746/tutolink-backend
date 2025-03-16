const Quiz = require("../models/Quiz");
const User = require("../models/User");

exports.createQuiz = async (req, res) => {
  try {
    const { subjectId, question, options, correctAnswer } = req.body;

    const quiz = new Quiz({ subject: subjectId, question, options, correctAnswer });
    await quiz.save();

    res.json({ message: "Quiz created", quiz });
  } catch (error) {
    res.status(500).json({ error: "Error creating quiz" });
  }
};

exports.getQuizzesBySubject = async (req, res) => {
  const { subjectId } = req.params;
  const quizzes = await Quiz.find({ subject: subjectId });
  res.json(quizzes);
};

exports.submitQuiz = async (req, res) => {
  try {
    const { userId, quizId, answer } = req.body;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (quiz.correctAnswer === answer) {
      user.points += 10;
      await user.save();
      res.json({ message: "Correct answer! +10 points", points: user.points });
    } else {
      res.json({ message: "Wrong answer", points: user.points });
    }
  } catch (error) {
    res.status(500).json({ error: "Error submitting quiz" });
  }
};
