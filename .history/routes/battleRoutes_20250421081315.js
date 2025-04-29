const express = require("express");
const router = express.Router();
const battleController = require("../controllers/battleController");
const { verifyToken } = require("../config/authMiddleware");

// Create a New Battle
router.post("/create", battleController.createBattle);

// Join a Battle
router.post("/join", battleController.joinBattle);

// Get Battle Details
router.get("/details", battleController.getBattleDetails);

// Submit an Answer
router.post("/submit", battleController.submitAnswer);

// Submit an Answer
router.post("/submit", battleController.submitAnswer);

// Get Live Scores
router.get("/scores", battleController.getLiveScores);

// Complete a Battle
router.post("/complete", battleController.completeBattle);

// Get Battle History
router.get("/history", verifyToken, battleController.getBattleHistory);

// Leave a Battle
router.post("/leave", battleController.leaveBattle);

module.exports = router;
