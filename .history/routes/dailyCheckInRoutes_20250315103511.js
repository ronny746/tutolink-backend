// routes/dailyCheckInRoutes.js

const express = require("express");
const router = express.Router();
const { dailyCheckIn, getUserCheckInHistory } = require("../controllers/dailyCheckInController");
const { verifyToken } = require("../config/authMiddleware"); // Ensure user is authenticated

router.post("/checkin", verifyToken, dailyCheckIn);
router.get("/checkinHistory", verifyToken, getUserCheckInHistory);
router.get("/userMissed", verifyToken, getUserCheckInHistory);

module.exports = router;
