const express = require("express");
const router = express.Router();
const { uploadQuiz, getQuizzes, updateQuiz,getallQuizzes,  deleteQuiz, getQuizById, submitQuiz } = require("../controllers/quizController");

router.post("/upload", uploadQuiz);
router.get("/", getQuizzes);
router.get("/all", getallQuizzes);
router.post("/update", updateQuiz);
router.delete("/delete", deleteQuiz);
router.get("/getQuizById", getQuizById);
router.get("/submitQuiz", submitQuiz);
module.exports = router;
