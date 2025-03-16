const express = require("express");
const router = express.Router();
const { uploadQuiz, getQuizzes, updateQuiz, deleteQuiz } = require("../controllers/quizController");

router.post("/upload", uploadQuiz);
router.get("/", getQuizzes);
router.post("/update", getQuizzes);
router.delete("/delete", deleteQuiz);

module.exports = router;
