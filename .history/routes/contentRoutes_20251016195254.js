const express = require("express");
const router = express.Router();
const upload = require("../config/multer"); // the file above
const { uploadContent, getContent, deleteContent, getExplore, getHome , uploadSlider,openAiQuestions } = require("../controllers/ContentController");
const { verifyToken } = require("../config/authMiddleware"); // Middleware import karo
router.post("/upload", uploadContent);

router.get("/", getContent);
router.post("/slider-upload", upload.single("image"), uploadSlider);
router.post("/openAiQuestion", openAiQuestions);
router.delete("/delete", deleteContent);
router.get("/getExplore", verifyToken, getExplore);
router.get("/getHome", verifyToken, getHome);

module.exports = router;
