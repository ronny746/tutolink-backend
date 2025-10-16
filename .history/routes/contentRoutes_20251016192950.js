const express = require("express");
const router = express.Router();
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images allowed'));
  }
});

const { uploadContent, getContent, deleteContent, getExplore, getHome, uploadSlider, openAiQuestions } = require("../controllers/ContentController");
const { verifyToken } = require("../config/authMiddleware");

// Use multer middleware for file uploads
router.post("/upload", upload.single("image"), uploadContent); // 'image' must match frontend field name
router.post("/slider-upload", upload.single("image"), uploadSlider);

router.get("/", getContent);
router.post("/openAiQuestion", openAiQuestions);
router.delete("/delete", deleteContent);
router.get("/getExplore", verifyToken, getExplore);
router.get("/getHome", verifyToken, getHome);

module.exports = router;
