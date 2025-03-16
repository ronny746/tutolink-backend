const Subject = require("../models/Subject");

// ✅ Create Subject
exports.createSubject = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: "Subject name is required" });

    const subject = new Subject({ name, description });
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

// ✅ Update Subject
exports.updateSubject = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const { iconUrl  } = req.body;

    const subject = await Subject.findByIdAndUpdate(subjectId, { name, description }, { new: true });

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
