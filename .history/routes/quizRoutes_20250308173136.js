const express = require("express");
const router = express.Router();
const { uploadQuiz, getQuizzes,deleteQuiz } = require("../controllers/quizController");

router.post("/upload", uploadQuiz);
router.get("/", getQuizzes);
router.("/", getQuizzes);

module.exports = router;
