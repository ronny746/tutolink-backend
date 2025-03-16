// routes/dailyCheckInRoutes.js

const express = require("express");
const router = express.Router();
const { dailyCheckIn } = require("../controllers/dailyCheckInController");
const { verifyToken } = require("../config/authMiddleware"); // Ensure user is authenticated

router.post("/checkin", authMiddleware, dailyCheckIn);

module.exports = router;
