const ClassOrCourse = require("../models/classCourse");

exports.getClassesOrCourses = async (req, res) => {
  try {
    const { categoryId } = req.query;
    const classesOrCourses = await ClassOrCourse.find({ categoryId }).populate("categoryId").lean();
    if (!classesOrCourses || classesOrCourses.length === 0) { 
      return res.status(404).json({ error: "No classes or courses found" });
    }
    res.json({ classesOrCourses });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch classes/courses", details: error.message });
  }
};

exports.createClassOrCourse = async (req, res) => {
  try {
    const { name, categoryId } = req.body;
    const classOrCourse = new ClassOrCourse({ name, categoryId });
    await classOrCourse.save();
    res.status(201).json({ message: "Class/Course created", classOrCourse });
  } catch (error) {
    res.status(500).json({ error: "Error creating class/course", details: error.message });
  }
};

exports.deleteClassOrCourse = async (req, res) => {
  try {
    const { courseId } = req.query;

    const course = await Cate.findByIdAndDelete(courseId);
    if (!course) return res.status(404).json({ error: "Class/Course not found" });

    res.json({ message: "Course deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting course", details: error.message });
  }
};