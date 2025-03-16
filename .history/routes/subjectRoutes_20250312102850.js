// const express = require("express");
// const router = express.Router();
// const subjectController = require("../controllers/subjectController");
// const multer = require("multer");
// const upload = multer({ storage: multer.memoryStorage() });

// // ✅ Subject Routes
// router.post("/create-subject", subjectController.createSubject);
// router.get("/get-subjects", subjectController.getSubjects);

// // ✅ Content Routes
// router.post("/upload-content", upload.single("file"), subjectController.uploadContent);
// router.get("/get-content", subjectController.getContent);

// // ✅ Quiz Routes
// router.post("/upload-quiz", subjectController.uploadQuiz);
// router.get("/get-quizzes", subjectController.getQuizzes);

// module.exports = router;

const express = require("express");
const router = express.Router();
const upload = require("../config/widdlware");
const { createSubject, getSubjects, deleteSubject, updateSubject } = require("../controllers/subjectController");

router.post("/create", upload.single("file"), createSubject);
router.get("/", getSubjects);
router.delete("/delete", deleteSubject);
router.put("/update", updateSubject);
module.exports = router;
