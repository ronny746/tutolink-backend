const express = require("express");
const router = express.Router();
const upload = require("../middlewares/uploadMiddleware"); // Middleware for handling file uploads
const { uploadContent, getContent } = require("../controllers/contentController");

router.post("/upload", upload.single("file"), uploadContent);
router.get("/", getContent);

module.exports = router;
