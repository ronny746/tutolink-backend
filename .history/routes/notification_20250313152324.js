const express = require("express");
const { getNotifications } = require("../controllers/notificationController");
const { verifyToken } = require("../config/authMiddleware"); // 🛡 Ensure user is logged in

const router = express.Router();

router.get("/", verifyToken, getNotifications);
router.get("/", verifyToken, getNotifications);

module.exports = router;
