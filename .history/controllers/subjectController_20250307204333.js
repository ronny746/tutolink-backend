const Subject = require("../models/Subject");
const bucket = require("../config/firebase"); // Import Firebase Storage

exports.uploadPDF = async (req, res) => {
  try {
    const { subjectName } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ message: "No file uploaded" });

    let subject = await Subject.findOne({ name: subjectName });

    if (!subject) {
      subject = new Subject({ name: subjectName, pdfs: [] });
    }

    // Upload file to Firebase Storage
    const fileUpload = bucket.file(file.originalname);
    await fileUpload.save(file.buffer, { contentType: file.mimetype });

    // Get the public URL
    const [url] = await fileUpload.getSignedUrl({
      action: "read",
      expires: "01-01-2030", // Expiry date
    });

    // Save URL to MongoDB
    subject.pdfs.push({ filename: file.originalname, url });
    await subject.save();

    res.json({ message: "PDF uploaded to Firebase", subject });
  } catch (error) {
    res.status(500).json({ error: "Error uploading PDF", details: error });
  }
};
