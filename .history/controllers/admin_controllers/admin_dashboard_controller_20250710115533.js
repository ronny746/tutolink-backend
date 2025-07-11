const User = require("../models/User");
// const Subject = require('../models/Subject');
// const Quiz = require('../models/Quiz');
// const Course = require('../models/Course');

exports.getAdminDashboard = async (req, res) => {
  try {
    const [totalUsers, totalSubjects, totalQuizzes, totalCourses, liveQuiz] = await Promise.all([
      User.countDocuments(),
      Subject.countDocuments(),
      Quiz.countDocuments(),
      Course.countDocuments(),
      Quiz.findOne({ status: 'live' }).sort({ updatedAt: -1 }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalSubjects,
        totalQuizzes,
        totalCourses,
        liveQuiz: liveQuiz
          ? {
              title: liveQuiz.title,
              teamsJoined: liveQuiz.teamsJoined || 0,
              timeRemaining: liveQuiz.timeRemaining || 0,
            }
          : null,
      },
    });
  } catch (error) {
    console.error('Dashboard Error:', error);
    res.status(500).json({ success: false, message: 'Something went wrong' });
  }
};
