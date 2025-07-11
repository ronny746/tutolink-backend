const Subject = require("../models/Subject");
const Image = require("../models/images");
const { v4: uuidv4 } = require("uuid");
const { bucket } = require("../config/firebase");

// ✅ Create Subject
exports.createSubject = async (req, res) => {
  try {
    const { name, description, classOrCourseId, iconUrl } = req.body;

    if (!name) return res.status(400).json({ error: "Subject name is required" });
    if (!classOrCourseId) return res.status(400).json({ error: "Class or Course ID is required" });
    if (!iconUrl) return res.status(400).json({ error: "Icon URL is required" });

    const subject = new Subject({
      name,
      description,
      classOrCourseId,
      iconUrl
    });

    await subject.save();

    res.status(201).json({ message: "Subject created successfully", subject });
  } catch (error) {
    res.status(500).json({ error: "Error creating subject", details: error.message });
  }
};

// ✅ Get All Subjects
exports.getAllSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find().lean();

    // Fetch quiz count for each subject
    const quizCounts = await Quiz.aggregate([
      { $group: { _id: "$subjectId", total: { $sum: 1 } } }
    ]);

    const quizCountMap = quizCounts.reduce((acc, item) => {
      acc[item._id.toString()] = item.total;
      return acc;
    }, {});

    // Merge quiz count into each subject
    const enrichedSubjects = subjects.map(subject => ({
      ...subject,
      quizCount: quizCountMap[subject._id.toString()] || 0
    }));

    res.json({
      success: true,
      message: "Subjects fetched successfully",
      subjects: enrichedSubjects
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Error fetching subjects",
      details: error.message
    });
  }
};

exports.getSubjects = async (req, res) => {
  try {
    const { classOrCourseId } = req.query;

    // Validate input
    if (!classOrCourseId) {
      return res.status(400).json({ error: "classOrCourseId is required" });
    }

    // Fetch subjects matching the given course ID
    const subjects = await Subject.find({ classOrCourseId })
      .populate("classOrCourseId", "name description") // populate only necessary fields
      .lean();

    res.status(200).json({
      message: "Subjects fetched successfully",
      subjects
    });
  } catch (error) {
    res.status(500).json({
      error: "Error fetching subjects",
      details: error.message
    });
  }
};


// GET /api/subjects?classOrCourseId=xyz456
exports.getSubjectsByClassOrCourse = async (req, res) => {
  try {
    const { classOrCourseId } = req.query;
    const subjects = await Subject.find({ classOrCourseId });
    res.json({ subjects });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch subjects", details: error.message });
  }
};

// ✅ Update Subject
exports.updateSubject = async (req, res) => {
  try {
    const { id, iconUrl, classOrCourseId } = req.body;

    if (!id) return res.status(400).json({ error: "Subject ID is required" });

    const updateData = {};
    if (iconUrl) updateData.iconUrl = iconUrl;
    if (classOrCourseId) updateData.classOrCourseId = classOrCourseId;

    const subject = await Subject.findByIdAndUpdate(id, updateData, { new: true });

    if (!subject) return res.status(404).json({ error: "Subject not found" });

    res.json({ message: "Subject updated successfully", subject });
  } catch (error) {
    res.status(500).json({ error: "Error updating subject", details: error.message });
  }
};


// ✅ Delete Subject
exports.deleteSubject = async (req, res) => {
  try {
    const { subjectId } = req.query;

    const subject = await Subject.findByIdAndDelete(subjectId);
    if (!subject) return res.status(404).json({ error: "Subject not found" });

    res.json({ message: "Subject deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting subject", details: error.message });
  }
};


exports.uploadImage = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: "No file uploaded" });

    const fileId = uuidv4();
    const fileUpload = bucket.file(`subjects/${fileId}-${file.originalname}`);

    await fileUpload.save(file.buffer, { contentType: file.mimetype });

    const [url] = await fileUpload.getSignedUrl({
      action: "read",
      expires: "01-01-2030", // or use a Date object
    });

    res.status(200).json({ iconUrl: url });
  } catch (error) {
    res.status(500).json({ error: "Image upload failed", details: error.message });
  }
};