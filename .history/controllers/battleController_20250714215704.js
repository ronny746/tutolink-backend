const Battle = require("../models/quizbattle");
// const Battle = require("../models/quizbattle");
const Quiz = require("../models/Quiz");
const { v4: uuidv4 } = require("uuid");
const User = require("../models/User");
const Question = require("../models/questions");


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
    const { battleCode } = req.body;
    console.log(battleCode);
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
    const { battleId } = req.query;
    const battle = await Battle.findById(battleId);

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

    const battle = await Battle.findById(battleId);
    if (!battle) {
      return res.status(404).json({ message: "Battle not found" });
    }

    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    const isCorrect = question.correctAnswer === answer;
    const points = isCorrect ? 10 : 0;

    const index = battle.scores.findIndex(s => s.userId.toString() === userId);

    if (index !== -1) {
      battle.scores[index].score += points;
      if (!battle.scores[index].answers) {
        battle.scores[index].answers = [];
      }
      battle.scores[index].answers.push({ questionId, answer, isCorrect });
    } else {
      battle.scores.push({
        userId,
        score: points,
        answers: [{ questionId, answer, isCorrect }]
      });
    }

    await battle.save();
    res.status(200).json({ success: true, message: "Answer submitted" });
  } catch (error) {
    res.status(500).json({ error: "Error submitting answer", details: error.message });
  }
};


// Get Live Scores
exports.getLiveScores = async (req, res) => {
  try {
    const { battleId } = req.query;
    const battle = await Battle.findById(battleId).populate("scores.userId", "name");
    if (!battle) {
      return res.status(404).json({ message: "Battle not found" });
    }

    const scores = battle.scores.map(s => ({
      userId: s.userId._id,
      name: s.userId.name,
      score: s.score
    }));

    res.status(200).json({ success: true, scores });
  } catch (error) {
    res.status(500).json({ error: "Error fetching live scores", details: error.message });
  }
};


// Complete a Battle
exports.completeBattle = async (req, res) => {
  try {
    const { battleId } = req.body;

    const battle = await Battle.findById(battleId).populate("scores.userId", "name");
    if (!battle) {
      return res.status(404).json({ message: "Battle not found" });
    }

    if (!battle.scores || battle.scores.length === 0) {
      return res.status(400).json({ message: "No participants in battle" });
    }

    // Find the highest score
    const highestScore = Math.max(...battle.scores.map(s => s.score));

    // Get the user(s) who achieved the highest score
    const winners = battle.scores
      .filter(s => s.score === highestScore)
      .map(s => s.userId); // This will be array of User objects (if populated)

    // Update battle status and optionally add winner(s)
    battle.status = "Ended";
    battle.winner = winners.length === 1 ? winners[0]._id : null; // store single winner if only one
    battle.winners = winners.map(w => w._id); // optional: store all winners in a list

    await battle.save();

    res.status(200).json({
      success: true,
      message: "Battle completed",
      battle,
      winner: winners.length === 1 ? winners[0] : winners
    });
  } catch (error) {
    res.status(500).json({ error: "Error completing battle", details: error.message });
  }
};



// Get Battle History for a User
exports.getBattleHistory = async (req, res) => {
  try {
    const { userId } = req.body;
    // Find battles where the user is in scores list
    const battles = await Battle.find({
      "scores.userId": userId
    })
      .sort({ createdAt: -1 })
      .populate("quizId", "name duration") // Optional: Populate quiz name/details
      .populate("scores.userId", "name");   // Optional: Populate user details

    res.status(200).json({ success: true, history: battles });
  } catch (error) {
    res.status(500).json({ error: "Error fetching battle history", details: error.message });
  }
};



// Leave a Battle
exports.leaveBattle = async (req, res) => {
  try {
    const { battleId, userId } = req.body;

    if (!battleId || !userId) {
      return res.status(400).json({ message: "Missing battleId or userId" });
    }

    const battle = await Battle.findById(battleId);
    if (!battle) {
      return res.status(404).json({ message: "Battle not found" });
    }

    // Remove user from participants
    battle.participants = battle.participants.filter(
      participant => participant.toString() !== userId
    );

    // Optional: If no participants left, end the battle
    if (battle.participants.length === 0) {
      battle.status = "Ended";
    }

    await battle.save();

    res.status(200).json({
      success: true,
      message: "User has left the battle",
      battle
    });

  } catch (error) {
    console.error("Error leaving battle:", error);
    res.status(500).json({
      error: "Error leaving battle",
      details: error.message
    });
  }
};

exports.getAllBattlesUser = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated" });
    }
console.l
    const battles = await Battle.find()
      .populate('quizId', 'name')
      .populate('createdBy', 'name')
      .populate('participants', '_id');

    if (!battles || battles.length === 0) {
      return res.status(404).json({ message: "No battles found" });
    }

    const formatTimeRemaining = (startTime) => {
      const now = new Date();
      const remaining = new Date(startTime) - now;
      if (remaining <= 0) return 'Already started';

      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
      return `${hours}h ${minutes}m ${seconds}s`;
    };

    const myCreatedBattles = [];
    const joinedBattles = [];

    battles.forEach(battle => {
      const isCreator = battle.createdBy?._id?.toString() === req.user._id;
      const isParticipant = battle.participants.some(
        p => p._id.toString() === req.user._id
      );

      const battleInfo = {
        title: battle.quizId?.name || 'N/A',
        code: battle.battleCode,
        status: battle.status,
        time: battle.startTime ? formatTimeRemaining(battle.startTime) : 'N/A',
        creator: battle.createdBy?.name || 'Unknown',
        participants: battle.participants.length,
        joined: isParticipant,
      };

      if (isCreator) {
        myCreatedBattles.push(battleInfo);
      } else if (isParticipant) {
        joinedBattles.push(battleInfo);
      }
    });

    res.status(200).json({
      success: true,
      myCreatedBattles,
      joinedBattles
    });

  } catch (error) {
    console.error("Error fetching battles:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

exports.getAllBattles = async (req, res) => {
  try {
    const battles = await Battle.find();

    res.status(200).json({
      success: true,
      battles,
    });
  } catch (error) {
    console.error("❌ Error fetching battles:", error.message);
    res.status(500).json({
      error: "Error fetching battles",
      details: error.message,
    });
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

