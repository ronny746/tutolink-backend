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
      newUsersThisWeek,
      mostActiveQuizzesDocs,
      mostActiveQuiz,
      topUsers
    ] = await Promise.all([
      User.countDocuments(),
      Subject.countDocuments(),
      Quiz.countDocuments(),
      Course.countDocuments(),
      User.countDocuments({ createdAt: { $gte: oneWeekAgo } }),
      Quiz.find({}).sort({ participants: -1 }).limit(5),
      Quiz.findOne().sort({ participants: -1 }),
      User.find().sort({ averageScore: -1 }).limit(3),
    ]);

    const mostActiveQuizzes = mostActiveQuizzesDocs.map(quiz => ({
      name: quiz.name,
      subjectId: quiz.subjectId,
      participants: quiz.participants || 0,
      duration: quiz.duration,
    }));

    const topPerformers = topUsers.map((user, index) => ({
      place: `${index + 1}${['st', 'nd', 'rd'][index] || 'th'}`,
      name: user.name || 'Unknown',
      score: `${user.averageScore || 0} pts`,
    }));
    res.status(200).json({
      success: true,
      data: {
        stats: [
          { label: 'Total Users', value: totalUsers, page: 4, icon: 'people' },
          { label: 'Total Subjects', value: totalSubjects, page: 5, icon: 'menu_book' },
          { label: 'Total Quizzes', value: totalQuizzes, page: 6, icon: 'quiz' },
          { label: 'Total Courses', value: totalCourses, page: 7, icon: 'school' },
        ],
        
        mostActiveQuizzes,
        
        mostActiveQuiz: mostActiveQuiz?.name || 'N/A',
         mostActiveQuiz: mostActiveQuiz?.[0]?.name
      ? `Most Active Quiz: ${mostActiveQuizzes[0].name}`
      : 'Most Active Quiz: N/A',
        newUsersThisWeek,
        topPerformers,
      }
    });
  } catch (error) {
    console.error('Dashboard Error:', error);
    res.status(500).json({ success: false, message: 'Something went wrong' });
  }
};
