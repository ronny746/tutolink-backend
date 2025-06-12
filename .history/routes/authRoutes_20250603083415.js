const express = require("express");
const { googleLogin, getUser, updateUser, deleteUser, getAllUsers, getUserPerformance } = require("../controllers/authController");
const { verifyToken } = require("../config/authMiddleware"); // Middleware import karo

const router = express.Router();

router.post("/google-login", googleLogin);
router.get("/get-all-user", verifyToken, getAllUsers); // 🔒 Token required
router.get("/getUserPerformance", verifyToken, getUserPerformance); // 🔒 Token required
router.get("/", verifyToken, getUser); // 🔒 Token required
router.put("/:id", verifyToken, updateUser); // 🔒 Token required
router.delete("/:id", verifyToken, deleteUser); // 🔒 Token required

module.exports = router;
