const { v4: uuidv4 } = require("uuid");
const Content = require("../models/content");
const Subject = require("../models/Subject");
const Quiz = require("../models/Quiz");
const User = require("../models/User");
const Slider = require("../models/slider");
const path = require("path");
const fs = require("fs");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const apiKey = 'AIzaSyBNGgBHfErE0yfoiIklRClppDC1IOeYgRQ';
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// ----------------- Upload Content -----------------
exports.uploadContent = async (req, res) => {
  try {
    const { subjectId, pdfUrl, title } = req.body;
    if (!subjectId || !title || !pdfUrl) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const content = new Content({ subjectId, title, pdfUrl });
    await content.save();
    res.json({ message: "Content uploaded successfully", content });
  } catch (error) {
    res.status(500).json({ error: "Error uploading content", details: error.message });
  }
};

// ----------------- Get Content -----------------
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

// ----------------- Delete Content -----------------
exports.deleteContent = async (req, res) => {
  try {
    const { contentId } = req.query;
    const content = await Content.findById(contentId);
    if (!content) return res.status(404).json({ error: "Content not found" });
    await Content.findByIdAndDelete(contentId);
    res.json({ message: "Content deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting content", details: error.message });
  }
};

// ----------------- Upload Slider -----------------
exports.uploadSlider = async (req, res) => {
  try {
    const { title, category, redirectUrl } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ error: "No file uploaded" });
    if (!title) return res.status(400).json({ error: "Title is required" });

    const fileId = uuidv4();
    const ext = path.extname(file.originalname);
    const filename = `${fileId}${ext}`;
    const uploadDir = path.join(__dirname, '../uploads/sliders');

    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    const filepath = path.join(uploadDir, filename);
    fs.writeFileSync(filepath, file.buffer);

    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/sliders/${filename}`;

    const slider = new Slider({ title, category, imageUrl, redirectUrl });
    await slider.save();

    res.json({ message: "Slider uploaded successfully", slider });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error uploading slider", details: error.message });
  }
};

// ----------------- Delete Slider -----------------
exports.deleteSlider = async (req, res) => {
  try {
    const { sliderId } = req.query;
    const slider = await Slider.findById(sliderId);
    if (!slider) return res.status(404).json({ error: "Slider not found" });

    const filename = path.basename(slider.imageUrl);
    const filepath = path.join(__dirname, '../uploads/sliders', filename);

    if (fs.existsSync(filepath)) fs.unlinkSync(filepath);

    await Slider.findByIdAndDelete(sliderId);

    res.json({ message: "Slider deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting slider", details: error.message });
  }
};

// ----------------- OpenAI Quiz Questions -----------------
exports.openAiQuestions = async (req, res) => {
  try {
    const { topic } = req.body;
    if (!topic) return res.status(400).json({ error: "Topic is required" });

    const prompt = `
      Generate a quiz on the topic: "${topic}" in JSON format only.
      Include subjectId, name, totalPoints, rating, duration, participants, averageScore, startTime, endTime,
      instructions, and questions with options, correctAnswer, explanation, and time.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = await response.text();

    text = text.replace(/```json|```/g, '').trim();

    let quizData;
    try {
      quizData = JSON.parse(text);
    } catch (parseError) {
      console.error("JSON parse error:", parseError.message);
      return res.status(500).json({ error: "AI returned invalid JSON", details: parseError.message });
    }

    res.json(quizData);
  } catch (error) {
    console.error("AI Generation Error:", error.message);
    res.status(500).json({ error: "Error generating quiz", details: error.message });
  }
};
