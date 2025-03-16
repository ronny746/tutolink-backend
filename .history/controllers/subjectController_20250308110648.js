const { bucket } = require("../config/firebase");
const Content = require("../models/content"); // ✅ Ensure correct import
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


exports.uploadQuiz = async (req, res) => {
  try {
    const { subjectId, question, options, correctAnswer } = req.body;

    if (!subjectId || !question || !options || !correctAnswer) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (!Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ error: "Options must be an array with at least two choices" });
    }

    const newQuiz = new Quiz({ subjectId, question, options, correctAnswer });
    await newQuiz.save();

    res.status(201).json({ message: "Quiz uploaded successfully", quiz: newQuiz });
  } catch (error) {
    res.status(500).json({ error: "Error uploading quiz", details: error.message });
  }
};


// 🔥 Get all Content from MongoDB
exports.getContent = async (req, res) => {
  try {
    const content = await Content.find();
    
    res.json({ message: "Content fetched successfully", content: content });
  } catch (error) {
    console.error("Error fetching content:", error);
    res.status(500).json({ error: "Error fetching content", details: error.message });
  }
};

