const express = require("express");
const router = express.Router();
const { uploadQuiz, createQuizForBattle, getQuizzes, updateQuiz, getallQuizzes, deleteQuiz, getQuizById, submitQuiz, getQuizReview, deleteUserTakenQuiz, quizResult,getPDFReview } = require("../controllers/quizController");
const { verifyToken } = require("../config/authMiddleware"); // Middleware import karo
router.post("/upload", uploadQuiz);
router.post("/createForBattle", createQuizForBattle);
router.get("/", verifyToken, getQuizzes);
router.get("/all", getallQuizzes);
router.post("/update", updateQuiz);
router.delete("/delete", deleteQuiz);
router.get("/getQuizById", getQuizById);
router.post("/submitQuiz", verifyToken, submitQuiz);
router.get("/review/:quizId", verifyToken, getQuizReview);
router.get("/getPDFReview/:quizId", verifyToken, ge);
router.get("/quizResult/:quizId", verifyToken, quizResult);
router.delete("/deleteTaken/:quizId", verifyToken, deleteUserTakenQuiz);
module.exports = router;
