const express = require("express");
const router = express.Router();
const upload = require("../config/widdlware");
const { getClassesOrCourses, createClassOrCourse, deleteClassOrCourse,} = require("../controllers/classCourseController");

router.post("/create", createClassOrCourse);
router.get("/", getClassesOrCourses);
router.delete("/delete", deleteClassOrCourse);

module.exports = router;