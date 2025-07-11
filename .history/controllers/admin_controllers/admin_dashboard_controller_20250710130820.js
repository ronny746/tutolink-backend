
const User = require('../../models/User');
const Subject = require('../../models/Subject');
const Quiz = require('../../models/Quiz');
const Course = require('../../models/classCourse');

exports.getAdminDashboard = async (req, res) => {
  try {
    const [totalUsers, totalSubjects, totalQuizzes, totalCourses, liveQuizzes] = await Promise.all([
      User.countDocuments(),
      Subject.countDocuments(),
      Quiz.countDocuments(),
      Course.countDocuments(),
      Quiz.find({ status: 'Live' }).sort({ updatedAt: -1 }), // 🔄 get all live quizzes
    ]);

    const liveQuizList = liveQuizzes.map((quiz) => ({
      title: quiz.name,
      teamsJoined: quiz.participants || 0,
      timeRemaining: quiz.totalPoints || 0, // ❗ change this logic if needed
    }));

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalSubjects,
        totalQuizzes,
        totalCourses,
        liveQuizzes: liveQuizList.length ? liveQuizList : null,
      },
    });
  } catch (error) {
    console.error('Dashboard Error:', error);
    res.status(500).json({ success: false, message: 'Something went wrong' });
  }
};
