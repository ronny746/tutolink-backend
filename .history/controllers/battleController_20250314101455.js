const QuizBattle = require("../models/"); // Your QuizBattle model
const User = require("../models/User");

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
    // Example: You can add logic to join a battle (e.g., add userId to a participants array)
    // For simplicity, we'll assume that the battle already has two players.
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

    // Dummy checkAnswer function; replace with your own logic
    const isCorrect = checkAnswer(questionId, answer);
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
    res.status(200).json({ success: true, scores: { player1Score: battle.player1Score, player2Score: battle.player2Score } });
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
    // Example logic: If user leaves, mark battle as cancelled.
    battle.status = "Ended"; // or "Cancelled", based on your business logic
    await battle.save();
    res.status(200).json({ success: true, message: "Left the battle", battle });
  } catch (error) {
    res.status(500).json({ error: "Error leaving battle", details: error.message });
  }
};

// Dummy checkAnswer function (to be replaced with actual logic)
function checkAnswer(questionId, answer) {
  // For demo purposes, randomly return true/false.
  return Math.random() > 0.5;
}
