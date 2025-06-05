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
    const user = await User.findById(userId, "name points dailyScore lastCheckIn categoryId classOrCourseId");
    console.log(user.classOrCourseId);
    const [subjects, mysliders, featuredQuizzes, allQuizzes, latestContent, topRankedUsers] = await Promise.all([
      Subject.find({ classOrCourseId: user.classOrCourseId }, "name description iconUrl"), // 🟢 Filtered by user's category
      Slider.find().sort({ createdAt: -1 }),
      Quiz.find({ classOrCourseId: user.classOrCourseId }, "name totalQuestions duration rating startTime instructions").sort({ rating: -1 }),
      Quiz.find({ classOrCourseId: user.classOrCourseId }).sort({ startTime: 1 }),
      Content.find({ classOrCourseId: user.classOrCourseId }, "title pdfUrl videoUrl").sort({ createdAt: -1 }),
      User.find({}, "name points avatar").sort({ points: -1 }).limit(3)
    ]);


    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const battles = await Battle.find({
      status: "Upcoming" // Filter only the battles that are 'Upcoming'
    })
      .populate('quizId', 'name')  // Populate quiz title (Maths Basics, etc.)
      .populate('createdBy', 'name')  // Populate creator's username (Rohit)
      .populate('participants', '_id')  // Populate participants' ids for easy comparison


    // Function to format time in hh:mm:ss format
    const formatTimeRemaining = (startTime) => {
      const now = new Date();
      const remainingTime = new Date(startTime) - now;

      if (remainingTime <= 0) return 'Already started'; // If the battle already started

      const hours = Math.floor(remainingTime / (1000 * 60 * 60));
      const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);

      return `${hours}h ${minutes}m ${seconds}s`;
    };

    // Map over the battles and structure the response as per your requirement
    const battleDetails = battles.map(battle => {
      const participantsIds = battle.participants.map(p => p._id.toString());
      return {
        title: battle.quizId ? battle.quizId.name : 'N/A',
        code: battle.battleCode,
        time: battle.startTime ? formatTimeRemaining(battle.startTime) : 'N/A',
        creator: battle.createdBy ? battle.createdBy.name : 'Unknown',
        participants: battle.participants.length,
        joined: participantsIds.includes(userId),  // Ensure user is part of the battle
      };
    });




    const unreadNotificationsCount = await Notification.countDocuments({
      userId: userId,
      isRead: false
    });

    // 🟢 3. Subjects with Colors
    const subjectsWithColors = subjects.map((subject, index) => ({
      ...subject._doc,
      color1: colors[index % colors.length].color1,
      color2: colors[index % colors.length].color2,
      iconUrl: subject.iconUrl || "https://storage.googleapis.com/news-admin-997b0.appspot.com/subjects/de2e2438-99b6-4b26-9d1e-3d92d2354264-logo-removebg-preview.png?GoogleAccessId=firebase-adminsdk-3ubmp%40news-admin-997b0.iam.gserviceaccount.com&Expires=1893436200&Signature=ckFJzt%2FqZfTXbDvIPIavPR3Cjwh0pWA%2FAkjoie3dLOjuLd2CX14zqGdsnsSJOi43S9CgmG3nteN5d95sI8vhmuMLiiZMm3f4%2BOGb29XkAO45L2SkpN28VFrogmYHXhjp9vWnsLvhK7PO0lVWSAY05CTy6Q4LszZ1CkRqfCiDyZxFuMXGisbAukU4HqyWCMvHoFYTPNFGbfJL%2B501CyoB%2FA2qqsE2B9grq0V4T9dkxWFlEv0P6d%2Bxug0i8v14XsUs2%2BDdsBfDB7irxc%2FhzyZycoStm6ai0ksOSa1vpRnxRU286EuzbftYHvuIaPaqS8Coi8CoDxWMyP0ptXPtm21cyw%3D%3D" // Default icon if not provided
    }));

    // 🟢 4. Featured Quizzes with Colors
    // const playedQuizIds = (user.quizzesTaken || [])
    //   .filter(q => q.quizId)
    //   .map(q => q.quizId.toString());

    const quizzesWithColors = featuredQuizzes.map((quiz, index) => {
      const isPlayed = (user?.quizzesTaken || []).some(q => q.quizId?._id?.toString() === quiz._id.toString());

      return {
        ...quiz._doc,
        color1: colors[(index + subjects.length) % colors.length].color1,
        color2: colors[(index + subjects.length) % colors.length].color2,
        isPlayed
      };
    });


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
        Battles: { // 🟢 Sliders Section
          type: "Battles",
          heading: "Running Battles",
          items: battleDetails
        },
        Myslider: { // 🟢 Sliders Section
          type: "slider",
          heading: "New content",
          items: mysliders
        },
        subjects: { // 🟢 Subjects Section
          type: "subjects",
          heading: "My Subjects",
          items: subjectsWithColors
        },
        featuredQuizzes: { // 🟢 Featured Quizzes
          type: "quizzes",
          heading: "Featured Quizzes",
          items: quizzesWithColors
        },
        ongoingQuizzes: { // 🟢 Ongoing Quizzes
          type: "quizzes",
          heading: "Ongoing Quizzes",
          items: ongoingQuizzes
        },
        upcomingQuizzes: { // 🟢 Upcoming Quizzes
          type: "quizzes",
          heading: "Upcoming Quizzes",
          items: upcomingQuizzes
        },
        latestContent: { // 🟢 Latest Content
          type: "content",
          heading: "Latest Content",
          items: latestContent
        },
        userStats: { // 🟢 User Stats Section
          type: "stats",
          heading: "Your Stats",
          rank: `#${userRank}`,
          points: user.points,
          lastCheckIn: user.lastCheckIn,
          unreadNotifications: unreadNotificationsCount
        },
        topRankedUsers: { // 🟢 Top Users Section
          type: "leaderboard",
          heading: "Top Rankers",
          items: rankedUsers
        }
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