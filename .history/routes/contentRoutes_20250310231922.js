const express = require("express");
const router = express.Router();
const upload = require("../config/widdlware"); // Middleware for handling file uploads
const { uploadContent, getContent, deleteContent, getExplore, getHome } = require("../controllers/ContentController");
const { verifyToken } = require("../config/authMiddleware"); // Middleware import karo
router.post("/upload", upload.single("file"), uploadContent);
router.get("/", getContent);
router.delete("/delete", deleteContent);
router.get("/getExplore", verifyToken, getExplore);
router.get("/getExplore", verifyToken, getExplore);
module.exports = router;
