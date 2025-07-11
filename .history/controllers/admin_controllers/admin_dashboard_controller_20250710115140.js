// routes/admin.js

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Subject = require('../models/Subject');
const Quiz = require('../models/Quiz');
const Course = require('../models/Course');

router.get('/dashboard', async (req, res) => {
  try {
    const [totalUsers, totalSubjects, totalQuizzes, totalCourses, liveQuiz] = await Promise.all([
      User.countDocuments(),
      Subject.countDocuments(),
      Quiz.countDocuments(),
      Course.countDocuments(),
      Quiz.findOne({ status: 'live' }).sort({ updatedAt: -1 }) // assuming latest live
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalSubjects,
        totalQuizzes,
        totalCourses,
        liveQuiz: liveQuiz ? {
          title: liveQuiz.title,
          teamsJoined: liveQuiz.teamsJoined || 0,
          timeRemaining: liveQuiz.timeRemaining || 0,
        } : null,
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

module.exports = router;
