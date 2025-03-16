// routes/dailyCheckInRoutes.js

const express = require("express");
const router = express.Router();
const { dailyCheckIn, getUserCheckInHistory } = require("../controllers/dailyCheckInController");
const { verifyToken } = require("../config/authMiddleware"); // Ensure user is authenticated

router.post("/checkin", verifyToken, dailyCheckIn);
router.post("/checkinHistory", verifyToken, getUserCheckInHistory);

module.exports = router;
