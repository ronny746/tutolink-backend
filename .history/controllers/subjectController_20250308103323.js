const { bucket } = require("../config/firebase");
const Content = require("../models/Content"); // ✅ Ensure correct import
const { v4: uuidv4 } = require("uuid");

// 🔥 Upload PDF to Firebase & Save in MongoDB
exports.uploadContent = async (req, res) => {
  try {
      console.log("Request received:", req.body);
      console.log("File received:", req.file);

      const { subjectId, title } = req.body;
      const file = req.file;

      if (!file) {
          console.log("No file uploaded");
          return res.status(400).json({ error: "No file uploaded" });
      }

      const fileId = uuidv4();
      const fileUpload = bucket.file(`content/${fileId}-${file.originalname}`);

      await fileUpload.save(file.buffer, { contentType: file.mimetype });

      const [url] = await fileUpload.getSignedUrl({
          action: "read",
          expires: "01-01-2030",
      });

      console.log("File uploaded successfully:", url);

      const content = new Content({
          subjectId,
          title,
          pdfUrl: url,
      });

      await content.save();

      res.json({ message: "Content uploaded successfully", pdfUrl: url });
  } catch (error) {
      console.error("Error uploading content:", error);
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
