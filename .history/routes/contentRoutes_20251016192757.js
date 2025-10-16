const express = require("express");
const router = express.Router();
// const upload = require("../config/widdlware"); // Middleware for handling file uploads
const { uploadContent, getContent, deleteContent, getExplore, getHome , uploadSlider,openAiQuestions } = require("../controllers/ContentController");
const { verifyToken } = require("../config/authMiddleware"); // Middleware import karo
router.post("/upload", uploadContent);
router.post("/slider-upload", upload.single("image"), uploadSlider);
router.get("/", getContent);
router.post("/openAiQuestion", openAiQuestions);
router.delete("/delete", deleteContent);
router.get("/getExplore", verifyToken, getExplore);
router.get("/getHome", verifyToken, getHome);

module.exports = router;
