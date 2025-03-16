const QuizBattle = require("../models/quizbattle");
const User = require("../models/User");
const Question = require("../models/Question");

// Create a New Battle
exports.createBattle = async (req, res) => {
  try {
    const { player1, player2, questions } = req.body;
    // Create a new battle document
    const battle = await QuizBattle.create({
      player1,
      player2,
      questions,
      player1Score: 0,
      player2Score: 0,
      status: "Pending"
    });
    res.status(201).json({ success: true, message: "Battle created successfully", battle });
  } catch (error) {
    res.status(500).json({ error: "Error creating battle", details: error.message });
  }
};

// Join a Battle
exports.joinBattle = async (req, res) => {
  try {
    const { battleId, userId } = req.body;
    const battle = await QuizBattle.findById(battleId);
    if (!battle) {
      return res.status(404).json({ message: "Battle not found" });
    }
    // Example logic: For simplicity, assume battle already has two players.
    res.status(200).json({ success: true, message: `User ${userId} joined the battle`, battle });
  } catch (error) {
    res.status(500).json({ error: "Error joining battle", details: error.message });
  }
};

// Get Battle Details
exports.getBattleDetails = async (req, res) => {
  try {
    const { battleId } = req.query;
    const battle = await QuizBattle.findById(battleId)
      .populate("player1", "name")
      .populate("player2", "name")
      .populate("questions");
    if (!battle) {
      return res.status(404).json({ message: "Battle not found" });
    }
    res.status(200).json({ success: true, battle });
  } catch (error) {
    res.status(500).json({ error: "Error fetching battle details", details: error.message });
  }
};

// Submit an Answer
exports.submitAnswer = async (req, res) => {
  try {
    const { battleId, userId, questionId, answer } = req.body;
    const battle = await QuizBattle.findById(battleId);
    if (!battle) {
      return res.status(404).json({ message: "Battle not found" });
    }

    // Updated: Asynchronously check if the answer is correct
    const isCorrect = await checkAnswer(questionId, answer);
    const points = isCorrect ? 10 : 0;

    if (battle.player1.toString() === userId) {
      battle.player1Score += points;
    } else if (battle.player2.toString() === userId) {
      battle.player2Score += points;
    }

    await battle.save();
    res.status(200).json({ success: true, message: "Answer submitted", battle });
  } catch (error) {
    res.status(500).json({ error: "Error submitting answer", details: error.message });
  }
};

// Get Live Scores
exports.getLiveScores = async (req, res) => {
  try {
    const { battleId } = req.query;
    const battle = await QuizBattle.findById(battleId, "player1Score player2Score");
    if (!battle) {
      return res.status(404).json({ message: "Battle not found" });
    }
    res.status(200).json({
      success: true,
      scores: { player1Score: battle.player1Score, player2Score: battle.player2Score }
    });
  } catch (error) {
    res.status(500).json({ error: "Error fetching live scores", details: error.message });
  }
};

// Complete a Battle
exports.completeBattle = async (req, res) => {
  try {
    const { battleId } = req.body;
    const battle = await QuizBattle.findById(battleId);
    if (!battle) {
      return res.status(404).json({ message: "Battle not found" });
    }
    // Set battle status to Completed and determine winner
    battle.status = "Completed";
    battle.winner = battle.player1Score > battle.player2Score ? battle.player1 : battle.player2;
    await battle.save();
    res.status(200).json({ success: true, message: "Battle completed", battle });
  } catch (error) {
    res.status(500).json({ error: "Error completing battle", details: error.message });
  }
};

// Get Battle History for a User
exports.getBattleHistory = async (req, res) => {
  try {
    const { userId } = req.query;
    // Find battles where the user is either player1 or player2
    const battles = await QuizBattle.find({
      $or: [{ player1: userId }, { player2: userId }]
    }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, history: battles });
  } catch (error) {
    res.status(500).json({ error: "Error fetching battle history", details: error.message });
  }
};

// Leave a Battle
exports.leaveBattle = async (req, res) => {
  try {
    const { battleId, userId } = req.body;
    const battle = await QuizBattle.findById(battleId);
    if (!battle) {
      return res.status(404).json({ message: "Battle not found" });
    }
    // Example logic: If user leaves, mark battle as ended or cancelled.
    battle.status = "Ended";
    await battle.save();
    res.status(200).json({ success: true, message: "Left the battle", battle });
  } catch (error) {
    res.status(500).json({ error: "Error leaving battle", details: error.message });
  }
};

// Asynchronous checkAnswer function that fetches the question from the database
async function checkAnswer(questionId, providedAnswer) {
  try {
    const question = await Question.findById(questionId).lean();
    if (!question) {
      return false;
    }
    // Compare provided answer with stored correctAnswer, ignoring case and whitespace
    return question.correctAnswer.trim().toUpperCase() === providedAnswer.trim().toUpperCase();
  } catch (error) {
    console.error("Error in checkAnswer:", error);
    return false;
  }
}
