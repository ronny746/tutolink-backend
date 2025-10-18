const { v4: uuidv4 } = require("uuid");
const Content = require("../models/content");
const Subject = require("../models/Subject");
const Quiz = require("../models/Quiz");
const User = require("../models/User");
const Slider = require("../models/slider");
const Notification = require("../models/notification");
const Battle = require("../models/quizbattle");
const path = require("path");
const fs = require("fs");

const apiKey = 'AIzaSyBNGgBHfErE0yfoiIklRClppDC1IOeYgRQ';
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// ✅ Upload Content with URL
exports.uploadContent = async (req, res) => {
  try {
    const { subjectId, pdfUrl, title } = req.body;

    const content = new Content({ subjectId, title, pdfUrl: pdfUrl });
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

    const content = await Content.findById(contentId);
    if (!content) return res.status(404).json({ error: "Content not found" });

    await Content.findByIdAndDelete(contentId);

    res.json({ message: "Content deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting content", details: error.message });
  }
};

// ✅ Get Explore
exports.getExplore = async (req, res) => {
  try {
    // const userId = req.user.id;
    // if (!userId) {
    //   return res.status(401).json({ message: "Unauthorized access" });
    // }

    // const user = await User.findById(userId).select("quizzesTaken");
    // if (!user) {
    //   return res.status(404).json({ message: "User not found" });
    // }

    // const attemptedQuizIds = user.quizzesTaken.map(q => q.quizId.toString());

    // Fetch all subjects with their related content
    const subjects = await Subject.find({})
      .select("name description")
      .lean();

    // Fetch contents with subject info
    const contents = await Content.find({})
      .select("title description type pdfUrl subject")
      .populate("subject", "name")
      .lean();

    // Fetch quizzes with subject info
    const quizzes = await Quiz.find({ _id: { $nin: attemptedQuizIds } })
      .select("name duration instructions subject questions")
      .populate("subject", "name")
      .lean();

    // Group data by subjects
    const subjectWiseData = subjects.map(subject => {
      // Filter quizzes for this subject
      const subjectQuizzes = quizzes.filter(
        quiz => quiz.subject && quiz.subject._id.toString() === subject._id.toString()
      ).map(quiz => ({
        id: quiz._id,
        name: quiz.name,
        duration: quiz.duration,
        instructions: quiz.instructions,
        totalQuestions: quiz.questions?.length || 0,
      }));

      // Filter contents for this subject
      const subjectContents = contents.filter(
        content => content.subject && content.subject._id.toString() === subject._id.toString()
      ).map(content => ({
        id: content._id,
        title: content.title,
        description: content.description,
        type: content.type,
        pdfUrl: content.pdfUrl,
      }));

      return {
        subjectId: subject._id,
        subjectName: subject.name,
        subjectDescription: subject.description,
        totalQuizzes: subjectQuizzes.length,
        totalContents: subjectContents.length,
        quizzes: subjectQuizzes,
        contents: subjectContents,
      };
    });

    // Filter out subjects with no content or quizzes (optional)
    const filteredSubjects = subjectWiseData.filter(
      subject => subject.totalQuizzes > 0 || subject.totalContents > 0
    );

    // Also provide ungrouped data for backward compatibility
    const allQuizzes = quizzes.map(quiz => ({
      id: quiz._id,
      name: quiz.name,
      duration: quiz.duration,
      instructions: quiz.instructions,
      totalQuestions: quiz.questions?.length || 0,
      subject: quiz.subject?.name || "General",
    }));

    const allContents = contents.map(content => ({
      id: content._id,
      title: content.title,
      description: content.description,
      type: content.type,
      pdfUrl: content.pdfUrl,
      subject: content.subject?.name || "General",
    }));

    res.json({
      success: true,
      message: "Explore data fetched successfully",
      data: {
        // Subject-wise grouped data
        subjectWise: filteredSubjects,

        // All data (for backward compatibility)
        all: {
          quizzes: allQuizzes,
          contents: allContents,
          subjects: subjects.map(s => ({
            id: s._id,
            name: s.name,
            description: s.description,
          })),
        },

        // Summary
        summary: {
          totalSubjects: filteredSubjects.length,
          totalQuizzes: allQuizzes.length,
          totalContents: allContents.length,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching explore data:", error);
    res.status(500).json({
      success: false,
      error: "Error fetching explore data",
      details: error.message
    });
  }
};

// ✅ Get Home
exports.getHome = async (req, res) => {
  try {
    const userId = req.user.id;
    const colors = [
      { color1: "0xFFAB47BC", color2: "0xFF8E24AA" },
      { color1: "0xFF42A5F5", color2: "0xFF1E88E5" },
      { color1: "0xFF26A69A", color2: "0xFF00897B" },
      { color1: "0xFFEF5350", color2: "0xFFD32F2F" },
      { color1: "0xFFFF7043", color2: "0xFFF4511E" },
      { color1: "0xFF66BB6A", color2: "0xFF43A047" },
      { color1: "0xFFFFCA28", color2: "0xFFFFA000" },
      { color1: "0xFF5C6BC0", color2: "0xFF3949AB" },
      { color1: "0xFFEC407A", color2: "0xFFD81B60" },
      { color1: "0xFF8D6E63", color2: "0xFF6D4C41" }
    ];

    const user = await User.findById(userId, "name points quizzesTaken dailyScore lastCheckIn classOrCourseId");
    if (!user) return res.status(404).json({ message: "User not found" });

    const [subjects, sliders, featuredQuizzes] = await Promise.all([
      Subject.find({ classOrCourseId: user.classOrCourseId }, "name description iconUrl"),
      Slider.find().sort({ createdAt: -1 }),
      Quiz.find({}, "name totalQuestions type duration rating startTime instructions")
        .sort({ rating: -1 })
    ]);

    const attemptedIds = new Set(user.quizzesTaken.map(q => q.quizId.toString()));
    const unattemptedQuizzes = featuredQuizzes.filter(q => !attemptedIds.has(q._id.toString()));

    const quizzesWithColors = unattemptedQuizzes.map((quiz, index) => ({
      ...quiz._doc,
      color1: colors[index % colors.length].color1,
      color2: colors[index % colors.length].color2
    }));

    const higherUsers = await User.countDocuments({ points: { $gt: user.points } });
    const userRank = higherUsers + 1;

    res.json({
      message: "Home data fetched successfully",
      data: {
        Myslider: {
          type: "slider",
          heading: "New content",
          items: sliders
        },
        featuredQuizzes: {
          type: "quizzes",
          heading: "Featured Quizzes",
          items: quizzesWithColors
        },
        userStats: {
          type: "stats",
          heading: "Your Stats",
          rank: `#${userRank}`,
          points: user.points,
          lastCheckIn: user.lastCheckIn
        }
      }
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch home data", details: err.message });
  }
};

// ✅ Upload Slider with Multer (Local Storage)
exports.uploadSlider = async (req, res) => {
  try {
    const { title, category, redirectUrl } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ error: "No file uploaded" });
    if (!title) return res.status(400).json({ error: "Title is required" });

    // Ensure upload directory exists
    const uploadDir = path.join(__dirname, "../uploads/sliders");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    // Generate a unique filename and move file if needed
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    const filepath = path.join(uploadDir, filename);

    // If Multer already saved the file to disk (diskStorage), move/rename it
    if (file.path) {
      fs.renameSync(file.path, filepath); // rename to our generated filename
    } else if (file.buffer) {
      // fallback if using memoryStorage
      fs.writeFileSync(filepath, file.buffer);
    } else {
      return res.status(400).json({ error: "File data is missing" });
    }

    // Generate public URL
    const imageUrl = `${req.protocol}://${req.get("host")}/uploads/sliders/${filename}`;

    // Save to database
    const slider = new Slider({ title, category, redirectUrl, imageUrl });
    await slider.save();

    res.status(200).json({ message: "Slider uploaded successfully", slider });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error uploading slider", details: err.message });
  }
};

// ✅ Delete Slider
exports.deleteSlider = async (req, res) => {
  try {
    const { sliderId } = req.query;

    const slider = await Slider.findById(sliderId);
    if (!slider) return res.status(404).json({ error: "Slider not found" });

    // ✅ Extract filename from URL
    const filename = path.basename(slider.imageUrl);
    const filepath = path.join(__dirname, '../uploads/sliders', filename);

    // ✅ Delete file from local storage
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }

    // ✅ Delete from database
    await Slider.findByIdAndDelete(sliderId);

    res.json({ message: "Slider deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting slider", details: error.message });
  }
};

// ✅ OpenAI Questions Generator
exports.openAiQuestions = async (req, res) => {
  try {
    const { topic } = req.body;
    if (!topic) {
      return res.status(400).json({ error: "Topic is required" });
    }

    const prompt = `
    Generate a quiz on the topic: "${topic}" in this JSON format:

    {
      "subjectId": "random_id_here",
      "name": "${topic}",
      "totalPoints": 10,
      "rating": 0,
      "duration": 10,
      "participants": 0,
      "averageScore": 0,
      "startTime": "YYYY-MM-DDTHH:MM:SS.000Z",
      "endTime": "YYYY-MM-DDTHH:MM:SS.000Z",
      "instructions": [
        "Test your knowledge on ${topic}!",
        "No negative marking."
      ],
      "questions": [
        {
          "question": "Question text here?",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswer": "A",
          "explanation": "Explanation about the answer.",
          "time": "2"
        }
      ]
    }

    Output only JSON without any extra text.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = await response.text();

    text = text.replace(/```json|```/g, '').trim();

    const quizData = JSON.parse(text);
    res.json(quizData);

  } catch (error) {
    console.error("❌ AI Generation Error:", error.message);
    res.status(500).json({ error: "Error generating quiz" });
  }
};