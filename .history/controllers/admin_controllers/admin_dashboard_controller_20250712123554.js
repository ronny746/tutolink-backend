const User = require('../../models/User');
const Subject = require('../../models/Subject');
const Quiz = require('../../models/Quiz');
const Course = require('../../models/classCourse');

exports.getAdminDashboard = async (req, res) => {
  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const [
      totalUsers,
      totalSubjects,
      totalQuizzes,
      totalCourses,
      liveQuizzes,
      newUsersThisWeek,
      mostActiveQuizDoc,
      topUsers
    ] = await Promise.all([
      User.countDocuments(),
      Subject.countDocuments(),
      Quiz.countDocuments(),
      Course.countDocuments(),
      Quiz.find({ status: 'Live' }).sort({ updatedAt: -1 }),
      User.countDocuments({ createdAt: { $gte: oneWeekAgo } }),
      Quiz.findOne().sort({ participants: -1 }),
      User.find().sort({ averageScore: -1 }).limit(3),
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

    const topPerformers = topUsers.map((user, index) => ({
      place: `${index + 1}${['st', 'nd', 'rd'][index] || 'th'}`,
      name: user.name || 'Unknown',
      score: `${user.points || 0} pts`,
    }));

    res.status(200).json({
      success: true,
      data: {
        stats: [
          { label: 'Total Users', value: totalUsers, page: 4, icon: 'people' },
          { label: 'Total Subjects', value: totalSubjects, page: 5, icon: 'menu_book' },
          { label: 'Total Quizzes', value: totalQuizzes, page: 2, icon: 'quiz' },
          { label: 'Total Courses', value: totalCourses, page: 3, icon: 'school' },
        ],
        liveQuizzes: liveQuizList.length ? liveQuizList : [],
        newUsersThisWeek,
        mostActiveQuiz: mostActiveQuizDoc
          ? {
            name: mostActiveQuizDoc.name,
            subjectId: mostActiveQuizDoc.subjectId,
            participants: mostActiveQuizDoc.participants || 0,
            duration: mostActiveQuizDoc.duration,
          }
          : null,
        topPerformers,
      }
    });
  } catch (error) {
    console.error('Dashboard Error:', error);
    res.status(500).json({ success: false, message: 'Something went wrong' });
  }
};
