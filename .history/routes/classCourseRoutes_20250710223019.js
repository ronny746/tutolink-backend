const express = require("express");
const router = express.Router();
const upload = require("../config/widdlware");
const { getallcourses, getClassesOrCourses, createClassOrCourse, deleteClassOrCourse, } = require("../controllers/classCourseController");

router.get("/all", getallcourses);
router.post("/create", createClassOrCourse);
router.get("/", getClassesOrCourses);
router.delete("/delete", deleteClassOrCourse);

module.exports = router;