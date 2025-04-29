const Battle = require("../models/quizbattle");
// const Battle = require("../models/quizbattle");
const Quiz = require("../models/Quiz");
const { v4: uuidv4 } = require("uuid");
const User = require("../models/User");
const Question = require("../models/questions");

// Create a New Battle
// exports.createBattle = async (req, res) => {
//   try {
//     const { player1, player2, questions } = req.body;
//     // Create a new battle document
//     const battle = await QuizBattle.create({
//       player1,
//       player2,
//       questions,
//       player1Score: 0,
//       player2Score: 0,
//       status: "Pending"
//     });
//     res.status(201).json({ success: true, message: "Battle created successfully", battle });
//   } catch (error) {
//     res.status(500).json({ error: "Error creating battle", details: error.message });
//   }
// };

exports.createBattle = async (req, res) => {
  try {
    const { quizId, createdBy, startTime } = req.body;

    if (!quizId || !createdBy || !startTime) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    const battleCode = uuidv4().slice(0, 6).toUpperCase(); // Generate battle code

    const battle = new Battle({
      quizId,
      battleCode,
      createdBy,
      startTime: new Date(startTime),
      endTime: new Date(new Date(startTime).getTime() + quiz.duration * 60000), // Set end time
      status: "Upcoming"
    });

    await battle.save();

    res.status(201).json({ message: "Battle created successfully", battle });
  } catch (error) {
    console.error("Error creating battle:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Join a Battle
// exports.joinBattle = async (req, res) => {
//   try {
//     const { battleId, userId } = req.body;
//     const battle = await QuizBattle.findById(battleId);
//     if (!battle) {
//       return res.status(404).json({ message: "Battle not found" });
//     }
//     // Example logic: For simplicity, assume battle already has two players.
//     res.status(200).json({ success: true, message: `User ${userId} joined the battle`, battle });
//   } catch (error) {
//     res.status(500).json({ error: "Error joining battle", details: error.message });
//   }
// };

exports.joinBattle = async (req, res) => {
  try {
    const { battleCode, userId } = req.body;

    const battle = await Battle.findOne({ battleCode }).populate("quizId");
    
    if (!battle) {
      return res.status(404).json({ message: "Battle not found" });
    }

    // 🔹 Fetch user and check if they've taken the quiz before
    const user = await User.findById(userId).select("quizzesTaken");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

      // 🔹 Check if user has taken this quiz before
      const hasTakenQuiz = user.quizzesTaken.some(q => q.quizId.toString() === battle.quizId._id.toString());

      if (hasTakenQuiz) {
        return res.status(403).json({ message: "You have already taken this quiz and cannot join this battle." });
      }

    if (!battle.participants.includes(userId)) {
      battle.participants.push(userId);
      await battle.save();
    }

    res.status(200).json({
      message: "Joined battle successfully",
       startTime: battle.startTime,
      status: battle.status
    });
  } catch (error) {
    console.error("Error joining battle:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// 🔹 Start Battle (Only when startTime is reached)
exports.startBattle = async (req, res) => {
  try {
    const { battleCode, userId } = req.body;
    const battle = await Battle.findOne({ battleCode }).populate("quizId");

    if (!battle) {
      return res.status(404).json({ message: "Battle not found" });
    }

    const now = new Date();
    if (now < battle.startTime) {
      return res.status(400).json({ message: "Battle has not started yet" });
    }

    battle.status = "Live";
    await battle.save();

    const remainingTime = Math.max(0, (battle.endTime - now) / 1000);

    res.status(200).json({
      message: "Battle started!",
      remainingTime,
      quizId: battle.quizId._id
    });
  } catch (error) {
    console.error("Error starting battle:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// 🔹 Submit Score
exports.submitScore = async (req, res) => {
  try {
    const { battleCode, userId, score } = req.body;
    const battle = await Battle.findOne({ battleCode });

    if (!battle) {
      return res.status(404).json({ message: "Battle not found" });
    }

    const now = new Date();
    if (now > battle.endTime) {
      return res.status(400).json({ message: "Battle has ended" });
    }

    const existingScore = battle.scores.find(s => s.userId.toString() === userId);
    if (existingScore) {
      return res.status(400).json({ message: "Score already submitted" });
    }

    battle.scores.push({ userId, score, completedAt: new Date() });
    await battle.save();

    battle.scores.sort((a, b) => b.score - a.score);

    res.status(200).json({
      message: "Score submitted successfully",
      rankings: battle.scores.map((s, index) => ({
        rank: index + 1,
        userId: s.userId,
        score: s.score
      }))
    });
  } catch (error) {
    console.error("Error submitting score:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get Battle Details
exports.getBattleDetails = async (req, res) => {
  try {
    const { battleId  } = req.query;
    const battle = await QuizBattle.findById(battleId);
      
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
  
      // Check if the answer is correct
      const isCorrect = await checkAnswer(questionId, answer);
      const points = isCorrect ? 10 : 0;
  
      // Record answer in player's answer array and update score
      if (battle.player1.toString() === userId) {
        battle.player1Score += points;
        battle.player1Answers.push({ questionId, answer, isCorrect });
      } else if (battle.player2.toString() === userId) {
        battle.player2Score += points;
        battle.player2Answers.push({ questionId, answer, isCorrect });
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
      // Use the authenticated user's ID instead of a query parameter.
      const userId = '67ceb5a70b945bea8798670a';
  
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
    battle.status = "Completed";
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
      if (!question) return false;
      // Compare stored correctAnswer with providedAnswer (ignoring case and whitespace)
      return question.correctAnswer.trim().toUpperCase() === providedAnswer.trim().toUpperCase();
    } catch (error) {
      console.error("Error in checkAnswer:", error);
      return false;
    }
  }
  
