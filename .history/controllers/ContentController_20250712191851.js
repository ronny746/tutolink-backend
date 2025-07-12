const { bucket } = require("../config/firebase");
const { v4: uuidv4 } = require("uuid");
const Content = require("../models/content");
const Subject = require("../models/Subject");
const Quiz = require("../models/Quiz");
const User = require("../models/User");
const Slider = require("../models/slider");
const Notification = require("../models/notification");
const Battle = require("../models/quizbattle");


const apiKey = 'AIzaSyBNGgBHfErE0yfoiIklRClppDC1IOeYgRQ';
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
// ✅ Upload Content (PDF to Firebase)
// exports.uploadContent = async (req, res) => {
//   try {
//     const { subjectId, title } = req.body;
//     const file = req.file;

//     if (!file) return res.status(400).json({ error: "No file uploaded" });
//     if (!subjectId || !title) return res.status(400).json({ error: "Subject ID and title are required" });

//     const fileId = uuidv4();
//     const fileUpload = bucket.file(`content/${fileId}-${file.originalname}`);

//     await fileUpload.save(file.buffer, { contentType: file.mimetype });

//     const [url] = await fileUpload.getSignedUrl({ action: "read", expires: "01-01-2030" });

//     const content = new Content({ subjectId, title, pdfUrl: url });
//     await content.save();

//     res.json({ message: "Content uploaded successfully", content });
//   } catch (error) {
//     res.status(500).json({ error: "Error uploading content", details: error.message });
//   }
// };
exports.uploadContent = async (req, res) => {
 
  try {
   
    const { subjectId, pdfUrl, title } = req.body;
    // const file = req.file;

    // if (!file) return res.status(400).json({ error: "No file uploaded" });
    // if (!subjectId || !title) return res.status(400).json({ error: "Subject ID and title are required" });

    // const fileId = uuidv4();
    // const fileUpload = bucket.file(`content/${fileId}-${file.originalname}`);

    // await fileUpload.save(file.buffer, { contentType: file.mimetype });

    // const [url] = await fileUpload.getSignedUrl({ action: "read", expires: "01-01-2030" });

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



exports.getExplore = async (req, res) => {
  try {
    const userId = req.user.id; // ✅ Extract user ID from token
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized access" });
    }

    // ✅ Fetch user details with quizzesTaken
    const user = await User.findById(userId).select("quizzesTaken");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ Extract attempted quiz IDs
    const attemptedQuizIds = user.quizzesTaken.map(q => q.quizId.toString());

    // ✅ Fetch all content
    const contents = await Content.find({}, "title description type pdfUrl");

    // ✅ Fetch all subjects
    const subjects = await Subject.find({}, "name description");

    // ✅ Fetch only unattempted quizzes
    const quizzes = await Quiz.find(
      { _id: { $nin: attemptedQuizIds } }, // ❌ Exclude attempted quizzes
      "name duration instructions"
    );

    res.json({
      message: "Overview fetched successfully",
      data: {

        contents,
        subjects,
        quizzes, // ✅ Only unattempted quizzes
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Error fetching overview", details: error.message });
  }
};


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

    // ⛔️ Remove already attempted quizzes
    const attemptedIds = new Set(user.quizzesTaken.map(q => q.quizId.toString()));
    const unattemptedQuizzes = featuredQuizzes.filter(q => !attemptedIds.has(q._id.toString()));

    // 🎨 Apply gradient colors to each quiz
    const quizzesWithColors = unattemptedQuizzes.map((quiz, index) => ({
      ...quiz._doc,
      color1: colors[index % colors.length].color1,
      color2: colors[index % colors.length].color2
    }));

    // 🧮 Rank calculation
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





exports.uploadSlider = async (req, res) => {
  try {
    const { title, category, redirectUrl } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ error: "No file uploaded" });
    if (!title) return res.status(400).json({ error: "Title is required" });

    const fileId = uuidv4();
    const fileUpload = bucket.file(`sliders/${fileId}-${file.originalname}`);

    await fileUpload.save(file.buffer, { contentType: file.mimetype });

    const [url] = await fileUpload.getSignedUrl({ action: "read", expires: "01-01-2030" });

    const slider = new Slider({ title, category, imageUrl: url, redirectUrl });
    await slider.save();

    res.json({ message: "Slider uploaded successfully", slider });
  } catch (error) {
    res.status(500).json({ error: "Error uploading slider", details: error.message });
  }
};



exports.openAiQuestions = async (req, res) => {
  try {
    const { topic } = req.body;
    if (!topic) {
      return res.status(400).json({ error: "Topic is required" });
    }

    // ✅ Structured Prompting
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

    // ✅ Remove unwanted characters & backticks before parsing JSON
    text = text.replace(/```json|```/g, '').trim();

    const quizData = JSON.parse(text); // Parse only clean JSON
    res.json(quizData);

  } catch (error) {
    console.error("❌ AI Generation Error:", error.message);
    res.status(500).json({ error: "Error generating quiz" });
  }
};