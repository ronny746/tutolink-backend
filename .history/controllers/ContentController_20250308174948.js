const { bucket } = require("../config/firebase");
const { v4: uuidv4 } = require("uuid");
const Content = require("../models/content");

// ✅ Upload Content (PDF to Firebase)
exports.uploadContent = async (req, res) => {
  try {
    const { subjectId, title } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ error: "No file uploaded" });
    if (!subjectId || !title) return res.status(400).json({ error: "Subject ID and title are required" });

    const fileId = uuidv4();
    const fileUpload = bucket.file(`content/${fileId}-${file.originalname}`);

    await fileUpload.save(file.buffer, { contentType: file.mimetype });

    const [url] = await fileUpload.getSignedUrl({ action: "read", expires: "01-01-2030" });

    const content = new Content({ subjectId, title, pdfUrl: url });
    await content.save();

    res.json({ message: "Content uploaded successfully", content });
  } catch (error) {
    res.status(500).json({ error: "Error uploading content", details: error.message });
  }
};

// ✅ Get All Content by Subject ID
exports.getContent = async (req, res) => {
  try {
    const { subjectId } = req.query;
    const query = subjectId ? { subjectId } : {};

    const content = await Content.find(query);
    res.json({ message: "Content fetched successfully", content });
  } catch (error) {
    res.status(500).json({ error: "Error fetching content", details: error.message });
  }
};

// ✅ Update Content
exports.updateContent = async (req, res) => {
  try {
    const { contentId } = req.params;
    const { title } = req.body;

    const content = await Content.findByIdAndUpdate(contentId, { title }, { new: true });

    if (!content) return res.status(404).json({ error: "Content not found" });

    res.json({ message: "Content updated successfully", content });
  } catch (error) {
    res.status(500).json({ error: "Error updating content", details: error.message });
  }
};

// ✅ Delete Content
exports.deleteContent = async (req, res) => {
    try {
      const { contentId } = req.query;
  
      // ✅ Find content in MongoDB
      const content = await Content.findById(contentId);
      if (!content) return res.status(404).json({ error: "Content not found" });
  
      // ✅ Extract Firebase Storage path correctly
      const fileUrl = content.pdfUrl;
      const fileName = decodeURIComponent(fileUrl.split("/").pop().split("?")[0]); // Fix encoding issues
  
      console.log("Deleting file:", `content/${fileName}`);
  
      // ✅ Delete the file from Firebase Storage
      await bucket.file(`content/${fileName}`).delete();
  
      // ✅ Delete content from MongoDB
      await Content.findByIdAndDelete(contentId);
  
      res.json({ message: "Content deleted successfully from MongoDB and Firebase" });
    } catch (error) {
      res.status(500).json({ error: "Error deleting content", details: error.message });
    }
  };
  