const { bucket } = require("../config/firebase");
const { Content } = require("../config/mongodb");
const { v4: uuidv4 } = require("uuid");

// 🔥 Upload PDF to Firebase & Save in MongoDB
exports.uploadContent = async (req, res) => {
  try {
    const { subjectId, title } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ message: "No file uploaded" });

    const fileId = uuidv4();
    const fileUpload = bucket.file(`content/${fileId}-${file.originalname}`);

    // Upload PDF to Firebase Storage
    await fileUpload.save(file.buffer, { contentType: file.mimetype });

    // Get file URL
    const [pdfUrl] = await fileUpload.getSignedUrl({
      action: "read",
      expires: "01-01-2030",
    });

    // 🔥 Store in MongoDB
    const newContent = new Content({ subjectId, title, pdfUrl });
    await newContent.save();

    res.json({ message: "Content uploaded successfully", pdfUrl });
  } catch (error) {
    res.status(500).json({ error: "Error uploading content", details: error });
  }
};

// 🔥 Get all Content from MongoDB
exports.getContent = async (req, res) => {
  try {
    const { subjectId } = req.query;
    const query = subjectId ? { subjectId } : {};
    const content = await Content.find(query).populate("subjectId");

    res.json(content);
  } catch (error) {
    res.status(500).json({ error: "Error fetching content", details: error });
  }
};
