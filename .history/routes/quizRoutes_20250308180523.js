const express = require("express");
const router = express.Router();
const { uploadQuiz, getQuizzes,deleteQuiz } = require("../controllers/quizController");

router.post("/upload", uploadQuiz);
router.get("/", getQuizzes);
router.post("/", getQuizzes);
router.delete("/delete", deleteQuiz);

module.exports = router;
