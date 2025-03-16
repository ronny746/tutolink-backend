const { bucket, db } = require("../config/"); // Import Firebase
const { v4: uuidv4 } = require("uuid");

exports.uploadPDF = async (req, res) => {
  try {
    const { subjectName } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ message: "No file uploaded" });

    const fileId = uuidv4();
    const fileUpload = bucket.file(`${subjectName}/${fileId}-${file.originalname}`);

    await fileUpload.save(file.buffer, { contentType: file.mimetype });

    const [url] = await fileUpload.getSignedUrl({
      action: "read",
      expires: "01-01-2030",
    });

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

exports.getSubjects = async (req, res) => {
  try {
    const snapshot = await db.ref("subjects").once("value");
    const data = snapshot.val();
    if (!data) return res.json({ message: "No subjects found" });

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Error fetching subjects", details: error });
  }
};
