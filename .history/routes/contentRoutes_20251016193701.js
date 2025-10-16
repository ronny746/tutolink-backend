const express = require("express");
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const uploadFolder = path.join(__dirname, "../uploads");

// Make sure the uploads folder exists
if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder);
}

// Disk storage
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, path.join(__dirname, "../uploads/sliders"));
  },
  filename: function(req, file, cb) {
    const filename = `${Date.now()}-${file.originalname}`;
    cb(null, filename);
  }
});


const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images allowed'));
  }
});

const { uploadContent, getContent, deleteContent, getExplore, getHome, uploadSlider, openAiQuestions } = require("../controllers/ContentController");
const { verifyToken } = require("../config/authMiddleware");

// Routes with proper multer usage
router.post("/upload", (req, res) => {
  upload.single("image")(req, res, (err) => {
    if (err instanceof multer.MulterError) return res.status(400).json({ error: err.message });
    if (err) return res.status(400).json({ error: err.message });
    uploadContent(req, res);
  });
});

router.post("/slider-upload", upload.single("image"), uploadSlider);


// Other routes
router.get("/", getContent);
router.post("/openAiQuestion", openAiQuestions);
router.delete("/delete", deleteContent);
router.get("/getExplore", verifyToken, getExplore);
router.get("/getHome", verifyToken, getHome);

module.exports = router;
