const Subject = require("../models/Subject");

exports.uploadPDF = async (req, res) => {
  try {
    const { subjectName } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ message: "No file uploaded" });

    let subject = await Subject.findOne({ name: subjectName });

    if (!subject) {
      subject = new Subject({ name: subjectName, pdfs: [] });
    }

    const pdfUrl = `/uploads/${file.filename}`;
    subject.pdfs.push({ filename: file.filename, url: pdfUrl });

    await subject.save();
    res.json({ message: "PDF uploaded", subject });
  } catch (error) {
    res.status(500).json({ error: "Error uploading PDF" });
  }
};

exports.getSubjects = async (req, res) => {
  const subjects = await Subject.find();
  res.json(subjects);
};
