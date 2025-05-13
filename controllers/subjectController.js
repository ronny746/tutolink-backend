const Subject = require("../models/Subject");
const Image = require("../models/images");
const { v4: uuidv4 } = require("uuid");
const { bucket } = require("../config/firebase");

// ✅ Create Subject
exports.createSubject = async (req, res) => {
  try {
    const { name, description, classOrCourseId} = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ error: "No file uploaded" });
    if (!name) return res.status(400).json({ error: "Subject name is required" });
    if (!classOrCourseId) return res.status(400).json({ error: "Course or Class Id is required" });
   
    const fileId = uuidv4();
    const fileUpload = bucket.file(`subjects/${fileId}-${file.originalname}`);

    await fileUpload.save(file.buffer, { contentType: file.mimetype });

    let url;
    try {
      [url] = await fileUpload.getSignedUrl({ action: "read", expires: "01-01-2030" });
    } catch (err) {
      return res.status(500).json({ error: "Error generating file URL", details: err.message });
    }

    const subject = new Subject({ name, description, classOrCourseId, iconUrl: url });
    await subject.save();

    res.status(201).json({ message: "Subject created successfully", subject });
  } catch (error) {
    res.status(500).json({ error: "Error creating subject", details: error.message });
  }
};

// ✅ Get All Subjects
exports.getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find().lean();
    res.json({ message: "Subjects fetched successfully", subjects });
  } catch (error) {
    res.status(500).json({ error: "Error fetching subjects", details: error.message });
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

    const subject = await Subject.findByIdAndUpdate(id, { iconUrl }, { classOrCourseId },{ new: true });

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
    const { title } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ error: "No file uploaded" });
    if (!title) return res.status(400).json({ error: "Image title is required" });
    const fileId = uuidv4();
    const fileUpload = bucket.file(`images/${fileId}-${file.originalname}`);

    await fileUpload.save(file.buffer, { contentType: file.mimetype });

    const [url] = await fileUpload.getSignedUrl({ action: "read", expires: "01-01-2030" });

    const image = new Image({ title, imageUrl: url });
    await image.save();

    res.status(201).json({ message: "Image created successfully", image });
  } catch (error) {
    res.status(500).json({ error: "Error creating Image", details: error.message });
  }
}