const express = require("express");
const router = express.Router();
const upload = require("../middlewares/multerConfig"); // Import multer config
const { uploadPDF, getSubjects } = require("../controllers/subjectController"); // Import controllers

router.post("/subjects/upload", upload.single("file"), uploadPDF);
router.get("/subjects", getSubjects);

module.exports = router;
