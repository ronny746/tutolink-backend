const express = require("express");
const { getNotifications, markAsRead ,sendNotificationToAll, sendPushNotification} = require("../controllers/notificationController");
const { verifyToken } = require("../config/authMiddleware"); // 🛡 Ensure user is logged in

const router = express.Router();

router.get("/", verifyToken, getNotifications);
router.post("/markasRead", verifyToken, markAsRead);
router.post("/notifiToall", sendNotificationToAll);
router.post("/push", sendPushNotification);

module.exports = router;
