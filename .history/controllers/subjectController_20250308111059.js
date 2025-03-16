const { bucket } = require("../config/firebase");
const { v4: uuidv4 } = require("uuid");
const Subject = require("../models/Subject");
const Content = require("../models/content");
const Quiz = require("../models/Quiz");

// 📌 1️⃣ Subject Upload API
exports.createSubject = async (req, res) => {
  try {
    const { name, description } = req.body;

    const subject = new Subject({ name, description });
    await subject.save();

    res.status(201).json({ message: "Subject created successfully", subject });
  } catch (error) {
    res.status(500).json({ error: "Error creating subject", details: error.message });
  }
};

// 📌 2️⃣ Get All Subjects
exports.getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find();
    res.json({ message: "Subjects fetched successfully", subjects });
  } catch (error) {
    res.status(500).json({ error: "Error fetching subjects", details: error.message });
  }
};

// 📌 3️⃣ Upload Content (PDF to Firebase)
exports.uploadContent = async (req, res) => {
  try {
    console.log("Request received:", req.body);
    console.log("File received:", req.file);

    const { subjectId, title } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const fileId = uuidv4();
    const fileUpload = bucket.file(`content/${fileId}-${file.originalname}`);

    await fileUpload.save(file.buffer, { contentType: file.mimetype });

    const [url] = await fileUpload.getSignedUrl({
      action: "read",
      expires: "01-01-2030",
    });

    const content = new Content({ subjectId, title, pdfUrl: url });
    await content.save();

    res.json({ message: "Content uploaded successfully", content });
  } catch (error) {
    res.status(500).json({ error: "Error uploading content", details: error.message });
  }
};

// 📌 4️⃣ Get All Content by Subject ID
exports.getContent = async (req, res) => {
  try {
    const { subjectId } = req.query;
    const query = subjectId ? { subjectId } : {};

    const content = await Content.find(query).populate("subjectId");

    res.json({ message: "Content fetched successfully", content });
  } catch (error) {
    res.status(500).json({ error: "Error fetching content", details: error.message });
  }
};

// 📌 5️⃣ Upload Quiz
exports.uploadQuiz = async (req, res) => {
  try {
    const { subjectId, questions } = req.body;

    if (!subjectId || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: "Subject ID and a valid list of questions are required" });
    }

    const formattedQuestions = questions.map(({ question, options, correctAnswer, explanation }) => {
      if (!question || !options || !correctAnswer || !explanation) {
        throw new Error("Each question must have a question, options, correctAnswer, and explanation");
      }

      if (!Array.isArray(options) || options.length < 2) {
        throw new Error("Each question must have at least two options");
      }

      return { subjectId, question, options, correctAnswer, explanation };
    });

    const savedQuizzes = await Quiz.insertMany(formattedQuestions);

    res.status(201).json({ message: "Quizzes uploaded successfully", savedQuizzes });
  } catch (error) {
    res.status(500).json({ error: "Error uploading quizzes", details: error.message });
  }
};

// 📌 6️⃣ Get All Quizzes by Subject ID
exports.getQuizzes = async (req, res) => {
  try {
    const { subjectId } = req.query;
    const query = subjectId ? { subjectId } : {};

    const quizzes = await Quiz.find(query).populate("subjectId");

    res.json({ message: "Quizzes fetched successfully", quizzes });
  } catch (error) {
    res.status(500).json({ error: "Error fetching quizzes", details: error.message });
  }
};
