const express = require("express");
const router = express.Router();
const subjectController = require("../controllers/");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

// ✅ Subject Routes
router.post("/create-subject", subjectController.createSubject);
router.get("/get-subjects", subjectController.getSubjects);

// ✅ Content Routes
router.post("/upload-content", upload.single("file"), subjectController.uploadContent);
router.get("/get-content", subjectController.getContent);

// ✅ Quiz Routes
router.post("/upload-quiz", subjectController.uploadQuiz);
router.get("/get-quizzes", subjectController.getQuizzes);

module.exports = router;
