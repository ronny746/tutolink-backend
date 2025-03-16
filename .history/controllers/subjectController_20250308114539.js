const { bucket } = require("../config/firebase");
const { v4: uuidv4 } = require("uuid");
const Subject = require("../models/Subject");
const Content = require("../models/content");
const Quiz = require("../models/Quiz");
const Question = require("../models/questions"); // Import the Question model

// 📌 1️⃣ Create Subject
exports.createSubject = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: "Subject name is required" });

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
    const subjects = await Subject.find().lean();
    res.json({ message: "Subjects fetched successfully", subjects });
  } catch (error) {
    res.status(500).json({ error: "Error fetching subjects", details: error.message });
  }
};

// 📌 3️⃣ Upload Content (PDF to Firebase)
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

// 📌 4️⃣ Get All Content by Subject ID
exports.getContent = async (req, res) => {
  try {
    const { subjectId } = req.query;
    const query = subjectId ? { subjectId } : {};

    const content = await Content.find(query).populate("subjectId").lean();
    res.json({ message: "Content fetched successfully", content });
  } catch (error) {
    res.status(500).json({ error: "Error fetching content", details: error.message });
  }
};

// 📌 5️⃣ Upload Quiz with Multiple Questions
exports.uploadQuiz = async (req, res) => {
  try {
    const { subjectId, questions, totalPoints, rating, totalQuestions, duration, participants, averageScore, instructions } = req.body;

    if (!subjectId || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: "Subject ID and a valid list of questions are required" });
    }

    // ✅ Insert Questions
    const createdQuestions = await Question.insertMany(questions);

    // ✅ Create Quiz
    const quiz = new Quiz({
      subjectId,
      questions: createdQuestions.map(q => q._id), // Store Question IDs
      name,
      totalPoints,
      rating,
      totalQuestions: questions.length,
      duration,
      participants,
      averageScore,
      instructions
    });

    await quiz.save();

    res.status(201).json({ message: "Quiz uploaded successfully", quiz });
  } catch (error) {
    res.status(500).json({ error: "Error uploading quiz", details: error.message });
  }
};

// 📌 6️⃣ Get All Quizzes by Subject ID
exports.getQuizzes = async (req, res) => {
  try {
    const { subjectId } = req.query;
    if (!subjectId) return res.status(400).json({ error: "Subject ID is required" });

    // ✅ Find Subject
    const subject = await Subject.findById(subjectId).select("_id name description createdAt").lean();
    if (!subject) return res.status(404).json({ error: "Subject not found" });

    // ✅ Find Quizzes for this Subject
    const quizzes = await Quiz.find({ subjectId }).populate("questions").select("-subjectId -__v").lean();

    res.json({ message: "Quizzes fetched successfully", subject, quizzes });
  } catch (error) {
    res.status(500).json({ error: "Error fetching quizzes", details: error.message });
  }
};
