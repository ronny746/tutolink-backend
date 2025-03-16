// routes/dailyCheckInRoutes.js

const express = require("express");
const router = express.Router();
const { dailyCheckIn } = require("../controllers/dailyCheckInController");
const { verifyToken } = require("../config/authMiddleware"); // Ensure user is authenticated

router.post("/checkin", verifyToken, dailyCheckIn);
router.post("/checkin", verifyToken, dailyCheckIn);

module.exports = router;
