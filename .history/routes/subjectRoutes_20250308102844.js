const express = require("express");
const router = express.Router();
const upload = require("../config/widdlware"); // Import multer config
const { uploadContent, getContent } = require("../controllers/subjectController"); // Import controllers

router.post("/subjects/upload", upload.single("file"), uploadContent);
router.get("/subjects", getContent);

module.exports = router;
