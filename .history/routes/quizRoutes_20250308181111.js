const express = require("express");
const router = express.Router();
const { uploadQuiz, getQuizzes, updateQuiz,  deleteQuiz } = require("../controllers/quizController");

router.post("/upload", uploadQuiz);
router.get("/", getQuizzes);
router.get("/all", getQuizzes);
router.post("/update", updateQuiz);
router.delete("/delete", deleteQuiz);

module.exports = router;
