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
    // 🎨 Predefined colors list
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

    // ✅ Fetch all subjects
    const subjects = await Subject.find({}, "name description iconUrl");

    // ✅ Assign unique colors to subjects
    const subjectsWithColors = subjects.map((subject, index) => ({
      ...subject._doc,
      color1: colors[index % colors.length].color1,
      color2: colors[index % colors.length].color2
    }));

    // ✅ Fetch sliders
    const mysliders = await Slider.find().sort({ createdAt: -1 }); // Newest first

    // ✅ Fetch top 5 featured quizzes
    const featuredQuizzes = await Quiz.find({}, "name totalQuestions duration rating")
      .sort({ rating: -1 }); // Highest-rated quizzes first


    // ✅ Assign unique colors to quizzes
    const quizzesWithColors = featuredQuizzes.map((quiz, index) => ({
      ...quiz._doc,
      color1: colors[(index + subjects.length) % colors.length].color1,
      color2: colors[(index + subjects.length) % colors.length].color2
    }));
    const upcomingQuizzes = await Quiz.find({ startTime: { $gt: currentTime } })
      .sort({ startTime: 1 }) // Earliest first
      .limit(10); // Limit to 10 quizzes
    // ✅ Fetch latest 5 content items
    const latestContent = await Content.find({}, "title pdfUrl videoUrl")
      .sort({ createdAt: -1 }); // Newest first


    const user = await User.findById(userId, "name points");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ Get user rank: Count how many users have more points
    const higherRankedUsers = await User.countDocuments({ points: { $gt: user.points } });
    const userRank = higherRankedUsers + 1; // Rank starts from 1

    // ✅ Fetch top 3 ranked users
    let topRankedUsers = await User.find({}, "name points avatar")
      .sort({ points: -1 })
      .limit(3);

    // ✅ Replace logged-in user's name with "You"
    topRankedUsers = topRankedUsers.map(u => ({
      ...u._doc,
      name: u._id.toString() === userId ? "You" : u.name
    }));
    res.json({
      message: "Home data fetched successfully",
      data: {
        userStats: {
          rank: `#${userRank}`,
          points: user.points
        },
        mysliders,
        subjects: subjectsWithColors,
        featuredQuizzes: quizzesWithColors,
        upcomingQuizzes
        latestContent,
        topRankedUsers
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
