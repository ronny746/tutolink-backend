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

    let user = await User.findOne({ email });

    if (!user) {
      // Create new user if not found
      user = await User.create({
        name: name || "Unknown",
        email,
        googleId: uid,
        avatar: picture || "",
      });

      await Notification.create({
        userId: user._id,
        title: "Welcome to Tutolink!",
        message: "Get ready for amazing quizzes. Start exploring now!",
        type: "Welcome",
      });

    } else if (!user.googleId) {
      // If user exists but googleId is not set, update it
      user.googleId = uid;
      await user.save();
    }

    // Generate JWT token
    const jwtToken = jwt.sign({ id: user._id }, "tutolink");

    // Optionally exclude sensitive fields
    const safeUser = await User.findById(user._id).select(
      "-password -quizzesTaken -bookmarkedQuizzes -favoriteSubjects"
    );


    res.json({ token: jwtToken, user: safeUser });

  } catch (error) {
    console.error("Google Login Error:", error);

    let errorMessage = "Invalid Token";

    if (error.code === "auth/id-token-expired") {
      errorMessage = "Firebase ID token has expired. Please log in again.";
    } else if (error.code === "auth/argument-error") {
      errorMessage = "Invalid Firebase token format.";
    } else if (error.code === "auth/id-token-revoked") {
      errorMessage = "Firebase ID token has been revoked. Please log in again.";
    } else if (error.message?.includes("certificate has expired")) {
      errorMessage = "Firebase Admin SDK certificate has expired. Check your Firebase credentials.";
    }

    res.status(400).json({ message: errorMessage, error: error.message });
  }
};



// Get User by ID
exports.getUser = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId, "-bookmarkedQuizzes -favoriteSubjects -quizzesTaken")
      .populate({ path: "categoryId", select: "name" })
      .populate({ path: "classOrCourseId", select: "name" });

    if (!user) return res.status(404).json({ message: "User not found" });

    // ✅ Get quizzesTaken count separately
    const fullUser = await User.findById(userId, "quizzesTaken");
    const quizzesTakenCount = fullUser?.quizzesTaken?.length || 0;

    // ✅ Rank calculation
    const rank = await User.countDocuments({ points: { $gt: user.points } }) + 1;
    if (user.rank !== rank) {
      user.rank = rank;
      await user.save();
    }

    // ✅ Add count to response
    const userObj = user.toObject();
    userObj.quizzesTakenCount = quizzesTakenCount;

    res.json(userObj);
  } catch (error) {
    console.error("Get User Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};



// Update User
exports.updateUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByIdAndUpdate(userId, req.body, { new: true });
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
    const users = await User.find()
      .select('name email avatar role points rank subscriptionStatus categoryId classOrCourseId quizzesTaken')
      .populate('categoryId')
      .populate('classOrCourseId', 'name')
      .lean();

    const formattedUsers = users.map(user => ({
      userId: user._id,
      name: user.name,
      email: user.email || '',
      avatar: user.avatar || '',
      role: user.role || 'student',
      points: user.points || 0,
      rank: user.rank || 0,
      quizzesPlayed: user.quizzesTaken?.length || 0,
      subscriptionStatus: user.subscriptionStatus || 'Free',
      category: user.categoryId || 'NA',
      classOrCourses: Array.isArray(user.classOrCourseId)
        ? user.classOrCourseId.map(c => c?.name).filter(Boolean).join(', ')
        : '',
    }));

    res.json({ success: true, data: formattedUsers });
  } catch (error) {
    console.error("Get All Users Error:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
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

// In your controller (e.g., userController.js)



exports.resetAllUsersData = async (req, res) => {
  try {
    const updateFields = {
      bookmarkedQuizzes: [],
      favoriteSubjects: [],
      badges: [],
      subscriptionStatus: "Free",
      dailyScore: 0,
      lastCheckIn: null,
      quizzesTaken: [],
      progress: [],
      attendance: [],
      selectedSubjects: [],
      classOrCourseId: [],
    };

    const result = await User.updateMany({}, updateFields);

    res.json({
      message: "All user data reset successfully",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error resetting users:", error);
    res.status(500).json({ message: "Server error", error });
  }
};


