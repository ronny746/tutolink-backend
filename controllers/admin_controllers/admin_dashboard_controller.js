
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
      id: quiz._id,
      title: quiz.name,
      subjectId: quiz.subjectId,
      classOrCourseId: quiz.classOrCourseId,
      totalPoints: quiz.totalPoints,
      totalQuestions: quiz.totalQuestions,
      duration: quiz.duration,
      participants: quiz.participants || 0,
      averageScore: quiz.averageScore,
      instructions: quiz.instructions || [],
      startTime: quiz.startTime,
      endTime: quiz.endTime,
      status: quiz.status,
      createdAt: quiz.createdAt,
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
