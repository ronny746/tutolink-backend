const express = require("express");
const router = express.Router();
const upload = require("../"); // Middleware for handling file uploads
const { uploadContent, getContent } = require("../controllers/ContentController");

router.post("/upload", upload.single("file"), uploadContent);
router.get("/", getContent);

module.exports = router;
