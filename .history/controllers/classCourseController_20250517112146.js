const ClassOrCourse = require("../models/classCourse");

// Get classes/courses by category
exports.getClassesOrCourses = async (req, res) => {
  try {
    const { categoryId } = req.query;
    const filter = categoryId ? { categoryId } : {};
    const classesOrCourses = await ClassOrCourse.find(filter).populate("categoryId").lean();

    if (!classesOrCourses || classesOrCourses.length === 0) {
      return res.status(404).json({ error: "No classes or courses found" });
    }

    res.json({ classesOrCourses });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch classes/courses", details: error.message });
  }
};

// Create a new class/course
exports.createClassOrCourse = async (req, res) => {
  try {
    const payload = Array.isArray(req.body) ? req.body : [req.body];

    const dataToInsert = payload.map(({ name, color1, color2, categoryId }) => ({
      title: name,
      color1: [color1, color2],
      c
      icon: "", // optional: set default or get from req
      categoryId,
    }));

    const created = await ClassOrCourse.insertMany(dataToInsert);

    res.status(201).json({ message: "Class/Course(s) created", data: created });
  } catch (error) {
    res.status(500).json({ error: "Error creating class/course(s)", details: error.message });
  }
};

// Delete a class/course
exports.deleteClassOrCourse = async (req, res) => {
  try {
    const { courseId } = req.query;

    const course = await ClassOrCourse.findByIdAndDelete(courseId);
    if (!course) {
      return res.status(404).json({ error: "Class/Course not found" });
    }

    res.json({ message: "Course deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting course", details: error.message });
  }
};
