const express = require("express");
const { createQuiz, getQuizzesBySubject, submitQuiz } = require("../controllers/quizController");

const router = express.Router();

router.post("/create", createQuiz);
router.get("/:subjectId", getQuizzesBySubject);
router.post("/submit", submitQuiz);

module.exports = router;
