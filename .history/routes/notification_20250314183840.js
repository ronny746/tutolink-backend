const express = require("express");
const { getNotifications, markAsRead ,sendNotificationToAll} = require("../controllers/notificationController");
const { verifyToken } = require("../config/authMiddleware"); // 🛡 Ensure user is logged in

const router = express.Router();

router.get("/", verifyToken, getNotifications);
router.post("/markasRead", verifyToken, markAsRead);
router.post("/notifiToall", verifyToken, markAsRead);

module.exports = router;
