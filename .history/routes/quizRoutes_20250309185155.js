const express = require("express");
const router = express.Router();
const { uploadQuiz, getQuizzes, updateQuiz, getallQuizzes, deleteQuiz, getQuizById, submitQuiz, getQuizReview } = require("../controllers/quizController");
const { verifyToken } = require("../config/authMiddleware"); // Middleware import karo
router.post("/upload", uploadQuiz);
router.get("/", getQuizzes);
router.get("/all", getallQuizzes);
router.post("/update", updateQuiz);
router.delete("/delete", deleteQuiz);
router.get("/getQuizById", getQuizById);
router.post("/submitQuiz", verifyToken, submitQuiz);
router.get("/review/:quizId", verifyToken, getQuizReview);
module.exports = router;
