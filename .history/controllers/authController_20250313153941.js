const admin = require("firebase-admin");
const User = require("../models/User");
const jwt = require("jsonwebtoken");

const Notification = require("../models/notification");
exports.googleLogin = async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ message: "Token is required" });
  }

  try {
    // Verify Firebase Token
    const decodedToken = await admin.auth().verifyIdToken(token);


    const { uid, name, email, picture } = decodedToken;

    if (!email) {
      return res.status(400).json({ message: "Invalid Firebase token: Email not found" });
    }

    // Check if user exists
    let user = await User.findOne({ googleId: uid });
    
    if (!user) {
      // Create new user if not found
      user = await User.create({
        name: name || "Unknown",
        email,
        googleId: uid,
        avatar: picture || "" // Save profile picture
      });
    }
    

    // Generate JWT Token
    const jwtToken = jwt.sign({ id: user._id }, "tutolink", { expiresIn: "7d" });

    res.json({ token: jwtToken, user });
  } catch (error) {
    console.error("Google Login Error:", error); // Log the error for debugging

    let errorMessage = "Invalid Token";

    if (error.code === "auth/id-token-expired") {
      errorMessage = "Firebase ID token has expired. Please log in again.";
    } else if (error.code === "auth/argument-error") {
      errorMessage = "Invalid Firebase token format.";
    } else if (error.code === "auth/id-token-revoked") {
      errorMessage = "Firebase ID token has been revoked. Please log in again.";
    } else if (error.message.includes("certificate has expired")) {
      errorMessage = "Firebase Admin SDK certificate has expired. Check your Firebase credentials.";
    }

    res.status(400).json({ message: errorMessage, error: error.message });
  }
};





// Get User by ID


exports.getUser = async (req, res) => {
  try {
    const userId = req.user.id; // ✅ Token se user ID extract ho rahi hai
    console.log(userId);
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // ✅ Rank Calculate Based on Points
    const rank = await User.countDocuments({ points: { $gt: user.points } }) + 1;

    // ✅ Rank Update in User Schema
    if (user.rank !== rank) {
      user.rank = rank;
      await user.save();
    }

    res.json(user);
  } catch (error) {
    console.error("Get User Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};



// Update User
exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ message: "User updated successfully", user });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
};

// Delete User
exports.deleteUser = async (req, res) => {
  try {
    // Find user by ID
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Delete user from Firebase
    await admin.auth().deleteUser(user.googleId);

    // Delete user from MongoDB
    await User.findByIdAndDelete(req.params.id);

    res.json({ message: "User deleted successfully from Firebase & MongoDB" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
};


exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find(); // Sabhi users la raha hai

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};




exports.getUserPerformance = async (req, res) => {
  try {
    const userId = req.user.id;

    // ✅ User Fetch with Correct Populations
    const user = await User.findById(userId)
      .populate({
        path: "quizzesTaken.quizId",
        select: "name totalQuestions totalPoints duration subjectId",
        populate: {
          path: "subjectId", // ✅ Properly populating subject
          select: "name", // ✅ Selecting only the name
        },
      })
      .populate({
        path: "quizzesTaken.answers.questionId",
        select: "questionText",
      })
      .lean();

    if (!user) return res.status(404).json({ message: "User not found" });

    // ✅ Rank Calculation
    const rank = await User.countDocuments({ points: { $gt: user.points } }) + 1;

    // ✅ Subject-wise Total Quizzes & Points
    const subjects = user.quizzesTaken.reduce((acc, quiz) => {
      if (!quiz.quizId || !quiz.quizId.subjectId) return acc; // Skip if missing
      const subject = quiz.quizId.subjectId.name || "Unknown"; // ✅ Use subjectId.name
      if (!acc[subject]) acc[subject] = { totalQuizzes: 0, totalPoints: 0 };
      acc[subject].totalQuizzes += 1;
      acc[subject].totalPoints += quiz.score || 0;
      return acc;
    }, {});

    // ✅ Recent Quizzes Played
    const recentQuizzes = user.quizzesTaken
      .filter((quiz) => quiz.quizId)
      .sort((a, b) => new Date(b.dateTaken) - new Date(a.dateTaken))
      .slice(0, 5)
      .map((quiz) => ({
        quizId: quiz.quizId._id,
        title: quiz.quizId.name,
        subject: quiz.quizId.subjectId?.name || "Unknown", // ✅ Fix: Proper subject fetching
        questionsAnswered: quiz.answers.length,
        totalQuestions: quiz.quizId.totalQuestions,
        quizTime: quiz.quizId.duration || "N/A",
        status: quiz.answers.length === quiz.quizId.totalQuestions ? "Check Result" : "Continue Quiz",
      }));

    // ✅ Response Data
    const responseData = {
      points: user.points,
      quizzesPlayed: user.quizzesTaken.length,
      rank: `#${rank}`,
      subjects: Object.keys(subjects).map((key) => ({
        subject: key,
        totalQuizzes: subjects[key].totalQuizzes,
        totalPoints: subjects[key].totalPoints,
      })),
      recentQuizzes,
    };

    res.json(responseData);
  } catch (error) {
    console.error("Get Performance Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

