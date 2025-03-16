const express = require("express");
const router = express.Router();
const { uploadQuiz, getQuizzes, updateQuiz, getallQuizzes, deleteQuiz, getQuizById, submitQuiz } = require("../controllers/quizController");
const { verifyToken } = require("../config/widdlware");

router.post("/upload", verifyToken, uploadQuiz);
router.get("/", getQuizzes);
router.get("/all", getallQuizzes);
router.post("/update", verifyToken, updateQuiz);
router.delete("/delete", verifyToken, deleteQuiz);
router.get("/getQuizById", getQuizById);
router.post("/submit", verifyToken, submitQuiz);  // ✅ Quiz Submit API with Token

module.exports = router;
