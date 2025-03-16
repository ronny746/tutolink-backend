const { bucket } = require("../config/firebase");
const { v4: uuidv4 } = require("uuid");
const Content = require("../models/content");
const Subject = require("../models/Subject");
const Quiz = require("../models/Quiz");
const User = require("../models/User");
const Slider = require("../models/slider");

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
    const currentTime = new Date();

    // 🎨 1. Predefined Colors List
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

    // ✅ 2. Fetch All Required Data in Parallel
    const [subjects, mysliders, featuredQuizzes, allQuizzes, latestContent, user, topRankedUsers] = await Promise.all([
      Subject.find({}, "name description iconUrl"),
      Slider.find().sort({ createdAt: -1 }), // Newest sliders first
      Quiz.find({}, "name totalQuestions duration rating").sort({ rating: -1 }), // Highest-rated quizzes
      Quiz.find().sort({ startTime: 1 }), // For upcoming and ongoing quizzes
      Content.find({}, "title pdfUrl videoUrl").sort({ createdAt: -1 }), // Latest content
      User.findById(userId, "name points"),
      User.find({}, "name points avatar").sort({ points: -1 }).limit(3) // Top 3 users
    ]);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 🟢 3. Subjects with Colors
    const subjectsWithColors = subjects.map((subject, index) => ({
      ...subject._doc,
      color1: colors[index % colors.length].color1,
      color2: colors[index % colors.length].color2
    }));

    // 🟢 4. Featured Quizzes with Colors
    const quizzesWithColors = featuredQuizzes.map((quiz, index) => ({
      ...quiz._doc,
      color1: colors[(index + subjects.length) % colors.length].color1,
      color2: colors[(index + subjects.length) % colors.length].color2
    }));

    // 🟢 5. Upcoming Quizzes (Next 10 Quizzes)
    const upcomingQuizzes = allQuizzes.filter(quiz => new Date(quiz.startTime) > currentTime).slice(0, 10);

    // 🟢 6. Ongoing Quizzes (Active Quizzes)
    const ongoingQuizzes = allQuizzes.filter(quiz => new Date(quiz.startTime) <= currentTime && new Date(quiz.endTime) > currentTime);

    // 🟢 7. User Stats (Rank & Points)
    const higherRankedUsers = await User.countDocuments({ points: { $gt: user.points } });
    const userRank = higherRankedUsers + 1; // Rank starts from 1

    // 🟢 8. Top Ranked Users
    const rankedUsers = topRankedUsers.map(u => ({
      ...u._doc,
      name: u._id.toString() === userId ? "You" : u.name
    }));

    // 📢 9. Response Data
    res.json({
      message: "Home data fetched successfully",
      data: {
        mysliders, // 🟢 Sliders Section
        Myslider: { // 🟢 User Stats Section
          sliderHeading: `New content`,
          mysliders: mysliders
        },
        subjects: subjectsWithColors, // 🟢 Subjects Section
        featuredQuizzes: quizzesWithColors, // 🟢 Featured Quizzes
        ongoingQuizzes, // 🟢 Ongoing Quizzes
        upcomingQuizzes, // 🟢 Upcoming Quizzes
        latestContent, // 🟢 Latest Content
        userStats: { // 🟢 User Stats Section
          rank: `#${userRank}`,
          points: user.points
        },
        topRankedUsers: rankedUsers // 🟢 Top Users Section
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Error fetching home data", details: error.message });
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
