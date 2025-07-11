// routes/adminRoutes.js
const express = require("express");
const router = express.Router();
const adminController = require("../controllers/");
const { verifyToken } = require("../config/authMiddleware"); // Middleware import

// Login route
router.post("/login", adminController.loginAdmin);
router.post("/create", verifyToken, adminController.createAdmin);
router.get("/list", verifyToken, adminController.getAllAdmins);
router.put("/update/:adminId", verifyToken, adminController.editAdmin);
router.delete("/:adminId", verifyToken, adminController.deleteAdmin);

module.exports = router;
