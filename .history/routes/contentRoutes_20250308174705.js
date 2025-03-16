const express = require("express");
const router = express.Router();
const upload = require("../config/widdlware"); // Middleware for handling file uploads
const { uploadContent, getContent ,deleteContent } = require("../controllers/ContentController");

router.post("/upload", upload.single("file"), uploadContent);
router.get("/", getContent);

module.exports = router;
