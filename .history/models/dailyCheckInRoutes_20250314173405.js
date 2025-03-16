// routes/dailyCheckInRoutes.js

const express = require("express");
const router = express.Router();
const { dailyCheckIn } = require("../controllers/");
const authMiddleware = require("../middlewares/authMiddleware"); // Ensure user is authenticated

router.post("/checkin", authMiddleware, dailyCheckIn);

module.exports = router;
