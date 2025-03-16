const { bucket, db } = require("../config/firebase"); // Import Firebase
const { v4: uuidv4 } = require("uuid"); // To generate unique IDs

exports.uploadPDF = async (req, res) => {
  try {
    const { subjectName } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ message: "No file uploaded" });

    const fileId = uuidv4(); // Generate a unique ID
    const fileUpload = bucket.file(`${subjectName}/${fileId}-${file.originalname}`);

    await fileUpload.save(file.buffer, { contentType: file.mimetype });

    // Get public URL
    const [url] = await fileUpload.getSignedUrl({
      action: "read",
      expires: "01-01-2030",
    });

    // Save metadata to Firebase Realtime Database
    const pdfRef = db.ref(`subjects/${subjectName}`).push();
    pdfRef.set({
      id: pdfRef.key,
      filename: file.originalname,
      url: url,
    });

    res.json({ message: "PDF uploaded to Firebase", id: pdfRef.key, url });
  } catch (error) {
    res.status(500).json({ error: "Error uploading PDF", details: error });
  }
};
