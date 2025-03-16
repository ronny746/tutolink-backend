const express = require("express");
const { getNotifications } = require("../controllers/notificationController");
const { verifyToken } = require("../config/authMiddleware"); // 🛡 Ensure user is logged in

const router = express.Router();

router.get("/notifications", authMiddleware, getNotifications);

module.exports = router;
