const express = require("express");
const multer = require("multer");
const { uploadPDF, getSubjects } = require("../controllers/subjectController");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/upload", upload.single("pdf"), uploadPDF);
router.get("/", getSubjects);

module.exports = router;
