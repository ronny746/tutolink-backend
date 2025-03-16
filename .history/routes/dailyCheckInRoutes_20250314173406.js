// routes/dailyCheckInRoutes.js

const express = require("express");
const router = express.Router();
const { dailyCheckIn } = require("../controllers/dailyCheckInController");
const authMiddleware = require("../middlewares/authMiddleware"); // Ensure user is authenticated

router.post("/checkin", authMiddleware, dailyCheckIn);

module.exports = router;
