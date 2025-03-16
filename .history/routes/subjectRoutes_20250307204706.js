const express = require("express");
const router = express.Router();
const upload = require("../config/widdlware");
const { uploadPDF, getSubjects } = require("../controllers/subjectController");

router.post("/subjects/upload", upload.single("file"), uploadPDF);
router.get("/subjects", getSubjects);

module.exports = router;
