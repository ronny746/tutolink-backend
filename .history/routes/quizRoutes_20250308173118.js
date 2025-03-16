const express = require("express");
const router = express.Router();
const { uploadQuiz, getQuizzes,d } = require("../controllers/quizController");

router.post("/upload", uploadQuiz);
router.get("/", getQuizzes);

module.exports = router;
