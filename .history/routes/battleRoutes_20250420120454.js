const express = require("express");
const router = express.Router();
const battleController = require("../controllers/battleController");
const { verifyToken } = require("../config/authMiddleware");

// 🔹 Create Battle via AI + Topic
router.post("/create-with-topic", battleController.createWithTopic);

// 🔹 Create a New Battle (manual)
router.post("/create", battleController.createWithTopic);

// 🔹 Join a Battle
router.post("/join", battleController.joinBattle);

// 🔹 Start Battle
router.post("/start", battleController.startBattle);

// 🔹 Submit Answer
router.post("/submit", battleController.submitAnswer);

// 🔹 Submit Final Score
router.post("/submit-score", battleController.submitFinalScore);

// 🔹 Get Result
router.get("/result", battleController.getResult);

// 🔹 Get Battle Details
router.get("/details", battleController.getHistory);

// 🔹 Get Live Scores
router.get("/scores", battleController.getLiveScores);

// 🔹 Complete a Battle
router.post("/complete", battleController.completeBattle);

// 🔹 Get Battle History
router.get("/history", verifyToken, battleController.getBattleHistory);

// 🔹 Leave a Battle
router.post("/leave", battleController.leaveBattle);

module.exports = router;
