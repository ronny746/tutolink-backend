const express = require("express");
const { googleLogin, getUser, updateUser, deleteUser, getAllUsers } = require("../controllers/authController");
const { verifyToken } = require("../"); // Middleware import karo

const router = express.Router();

router.post("/login/google", googleLogin);
router.get("/get-all-user", verifyToken, getAllUsers); // 🔒 Token required
router.get("/:id", verifyToken, getUser); // 🔒 Token required
router.put("/:id", verifyToken, updateUser); // 🔒 Token required
router.delete("/:id", verifyToken, deleteUser); // 🔒 Token required

module.exports = router;
