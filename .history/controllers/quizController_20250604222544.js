const Quiz = require("../models/Quiz");
const Question = require("../models/questions");
const Subject = require("../models/Subject");
const User = require("../models/User");
const PDFDocument = require('pdfkit');
const moment = require('moment');
const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');
const path = require('path');
const apiKey = 'AIzaSyBNGgBHfErE0yfoiIklRClppDC1IOeYgRQ';
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
// ✅ Upload Quiz with Multiple Questions
exports.uploadQuiz = async (req, res) => {
  try {
    const { subjectId, categoryId, classOrCourseId, questions, name, totalPoints, rating, duration, participants, averageScore, instructions } = req.body;

    if (!subjectId || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: "Subject ID and a valid list of questions are required" });
    }

    // ✅ Insert Questions
    const createdQuestions = await Question.insertMany(questions);

    // ✅ Create Quiz
    const quiz = new Quiz({
      subjectId,
      categoryId,
      classOrCourseId,
      questions: createdQuestions.map(q => q._id), // Store Question IDs
      name,
      totalPoints,
      rating,
      totalQuestions: questions.length,
      duration,
      participants,
      averageScore,
      instructions
    });

    await quiz.save();

    res.status(201).json({ message: "Quiz uploaded successfully", quiz });
  } catch (error) {
    res.status(500).json({ error: "Error uploading quiz", details: error.message });
  }
};

// ✅ Get All Quizzes by Subject ID
exports.getQuizzes = async (req, res) => {
  try {
    const userId = req.user.id;
    const { subjectId } = req.query;

    if (!subjectId) {
      return res.status(400).json({ error: "Subject ID is required" });
    }

    // ✅ Find User's Attempted Quizzes
    const user = await User.findById(userId).select("quizzesTaken");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ Find Subject
    const subject = await Subject.findById(subjectId)
      .select("_id name description createdAt")
      .lean();

    if (!subject) {
      return res.status(404).json({ error: "Subject not found" });
    }

    // ✅ Get all quizzes for this subject
    const quizzes = await Quiz.find({ subjectId }).select("_id name duration instructions");

    // ✅ Get attempted quiz IDs (Set for fast lookup)
    const attemptedQuizIds = new Set(user.quizzesTaken.map(q => q.quizId.toString()));

    // ✅ Add isPlay field: true for attempted quizzes, false otherwise
    const modifiedQuizzes = quizzes.map(quiz => ({
      ...quiz.toObject(),
      isPlay: attemptedQuizIds.has(quiz._id.toString()) // ✅ Mark as played or not
    }));

    res.json({ message: "Quizzes fetched successfully", subject, quizzes: modifiedQuizzes });

  } catch (error) {
    res.status(500).json({ error: "Error fetching quizzes", details: error.message });
  }
};



exports.updateQuiz = async (req, res) => {
  try {
    const { quizId } = req.query; // Get quiz ID from URL
    const updateData = req.body; // Get updated fields from request body

    // Find and update the quiz
    const updatedQuiz = await Quiz.findByIdAndUpdate(
      quizId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    // If quiz not found
    if (!updatedQuiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    res.json({
      message: "Quiz updated successfully",
      quiz: updatedQuiz
    });
  } catch (error) {
    res.status(500).json({ error: "Error updating quiz", details: error.message });
  }
};


exports.getallQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find().select("name points duration instructions"); // Fetch specific fields

    res.json({
      message: "Quizzes fetched successfully",
      quizzes,
    });
  } catch (error) {
    res.status(500).json({ error: "Error fetching quizzes", details: error.message });
  }
};


// ✅ Delete Quiz
exports.deleteQuiz = async (req, res) => {
  try {
    const { quizId } = req.query;
    console.log(quizId);
    const quiz = await Quiz.findByIdAndDelete(quizId);
    if (!quiz) return res.status(404).json({ error: "Quiz not found" });

    res.json({ message: "Quiz deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting quiz", details: error.message });
  }
};

exports.getQuizById = async (req, res) => {
  try {
    const { quizId } = req.query;

    // Populate questions if they are referenced in the Quiz model
    const quiz = await Quiz.findById(quizId).populate("questions");

    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    res.json({
      message: "Quiz fetched successfully",
      quiz,
    });
  } catch (error) {
    res.status(500).json({ error: "Error fetching quiz", details: error.message });
  }
};



exports.submitQuiz = async (req, res) => {
  try {
    const { quizId, score, answers } = req.body;
    const userId = req.user.id;

    if (!quizId || score === undefined || !answers || answers.length === 0) {
      return res.status(400).json({ message: "Quiz ID, score, and answers are required" });
    }

    let user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    let quizIndex = user.quizzesTaken.findIndex(q => q.quizId.toString() === quizId);

    if (quizIndex !== -1) {
      // ✅ Quiz already attempted, update answers properly
      let existingQuiz = user.quizzesTaken[quizIndex];

      answers.forEach((newAnswer) => {
        let questionIndex = existingQuiz.answers.findIndex(
          (ans) => ans.questionId.toString() === newAnswer.questionId
        );

        if (questionIndex !== -1) {
          // ✅ Replace old answer with new one
          existingQuiz.answers[questionIndex] = newAnswer;
        } else {
          // ✅ Add new question's answer
          existingQuiz.answers.push(newAnswer);
        }
      });

      // ✅ Recalculate the score
      user.points -= existingQuiz.score; // Remove old score
      existingQuiz.score = score; // Update with new score
    } else {
      // ✅ First time attempting this quiz, add new entry
      user.quizzesTaken.push({ quizId, score, answers });
    }

    // user.points -= existingQuiz.score; // Remove old score
    // existingQuiz.score = newScore; // Update new score
    // user.points += newScore; // Add updated score
    user.points = user.quizzesTaken.reduce((acc, quiz) => acc + quiz.score, 0);
    // user.points += score; // Update total points correctly
    await user.save();

    res.json({
      message: "Quiz submitted successfully",
      quizzesTaken: user.quizzesTaken, // ✅ Multiple quizzes data return karenge
    });

  } catch (error) {
    console.error("Submit Quiz Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};


exports.getPDFReview = async (req, res) => {
  try {
    const { quizId } = req.params;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const takenQuiz = user.quizzesTaken.find(q => q.quizId.toString() === quizId);
    if (!takenQuiz) return res.status(404).json({ message: 'Quiz not found in user history' });

    const quiz = await Quiz.findById(quizId).populate('questions');
    const quizDetail = await Quiz.findById(quizId).select('name');
    
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    const review = quiz.questions.map((q, index) => ({
      questionId: q._id,
      question: q.question,
      options: q.options,
      selectedOption: takenQuiz.answers ? takenQuiz.answers[index]?.selectedOption : null,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation
    }));

    const logoPath = path.join(__dirname, '../assets/logo.png');
    const logo = await loadImage(logoPath);
    const size = 250;
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();

    ctx.globalAlpha = 0.1;
    ctx.drawImage(logo, 0, 0, size, size);
    const blurredLogoBuffer = canvas.toBuffer('image/png');

    const doc = new PDFDocument({ margin: 40 });
    const fileName = `review_${quizId}_${userId}.pdf`;
    const filePath = path.join(__dirname, `../public/reviews/${fileName}`);
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    const drawWatermark = () => {
      const centerX = doc.page.width / 2 - size / 2;
      const centerY = doc.page.height / 2 - size / 2;
      doc.image(blurredLogoBuffer, centerX, centerY, { width: size });
    };

    drawWatermark();
    doc.on('pageAdded', drawWatermark);

    // Calculate score
    const totalQuestions = review.length;
    const correctAnswers = review.filter(item => item.selectedOption === item.correctAnswer).length;
    const totalPoints = totalQuestions * 1;
    const obtainedPoints = correctAnswers * 1;

    // Header
    doc
      .fontSize(20)
      .fillColor('#000')
      .text(`Quiz Review Report`, { align: 'center' })
      .moveDown(1);

    doc
      .font('Helvetica-Bold')
      .fontSize(18)
      .text(`Name: ${user.name}`)
      .text(`Subject: ${quizDetail.name}`)
      .text(`Score: ${obtainedPoints} / ${totalPoints}`)
      .text(`Accuracy: ${((correctAnswers / totalQuestions) * 100).toFixed(2)}%`)
      .text(`Submit Date: ${moment(takenQuiz.dateTaken).format('MMMM Do YYYY, h:mm A')}`)
      .moveDown(1.5);


    // Questions
    review.forEach((item, idx) => {
      const isCorrect = item.selectedOption === item.correctAnswer;
      const questionNum = `${idx + 1}.`;

      doc.fontSize(16).fillColor('#1a1a1a').text(`${questionNum} ${item.question}`);
      doc.moveDown(0.5);

      item.options.forEach((opt, i) => {
        const label = String.fromCharCode(65 + i);
        doc.fontSize(13).fillColor('#000').text(`   ${label}) ${opt}`);
      });

      doc.moveDown(0.5);
      doc.fontSize(12).fillColor('#000').text(`Your Answer: ${item.selectedOption || 'Not Answered'}`);
      doc.fontSize(12).fillColor(isCorrect ? '#28a745' : '#dc3545').text(`Correct Answer: ${item.correctAnswer}`);

      doc.moveDown(0.3);
      doc.fontSize(12).fillColor('#007bff').text('Explanation:');
      doc.fontSize(12).fillColor('#000').text(item.explanation);

      doc.moveDown(1.2);
      doc.lineWidth(0.5).moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).strokeColor('#ccc').stroke();
      doc.moveDown(1);
    });

    doc.end();

    writeStream.on('finish', () => {
      res.json({ success: true, fileName });
    });

  } catch (error) {
    console.error('PDF Review Error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
exports.getQuizReview = async (req, res) => {
  try {
    const { quizId } = req.params; // Get quiz ID
    const userId = req.user.id; // Token se user ID extract

    // ✅ Find user
    let user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // ✅ Find user taken quiz
    let takenQuiz = user.quizzesTaken.find(q => q.quizId.toString() === quizId);
    if (!takenQuiz) return res.status(404).json({ message: "Quiz not found in user's history" });

    // ✅ Get all questions for this quiz
    let quiz = await Quiz.findById(quizId).populate("questions");
    let quizDetail = await Quiz.findById(quizId).select("name totalPoints rating duration  totalQuestions averageScore participants instructions ");

    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    // ✅ Prepare review data
    let review = quiz.questions.map((q, index) => ({
      questionId: q._id,
      question: q.question,
      options: q.options,
      selectedOption: takenQuiz.answers ? takenQuiz.answers[index] : null, // Store user's selected answers in DB
      correctAnswer: q.correctAnswer,
      explanation: q.explanation // ✅ Include Explanation
    }));

    res.json({ quizDetail, review });
  } catch (error) {
    console.error("Quiz Review Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};




exports.deleteUserTakenQuiz = async (req, res) => {
  try {
    const { quizId } = req.params; // Quiz ID from request
    const userId = req.user.id; // Token se user ID

    let user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // 🔹 Check if quiz exists in user's taken quizzes
    let quizIndex = user.quizzesTaken.findIndex(q => q.quizId.toString() === quizId);
    if (quizIndex === -1) {
      return res.status(404).json({ message: "Quiz attempt not found" });
    }

    // 🔹 Remove quiz attempt & update points
    let removedQuiz = user.quizzesTaken.splice(quizIndex, 1)[0];
    user.points -= removedQuiz.score; // Remove earned points

    await user.save();
    res.json({ message: "Quiz attempt deleted successfully", quizId });
  } catch (error) {
    console.error("Delete Quiz Attempt Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};



exports.quizResult = async (req, res) => {
  try {
    const { quizId } = req.params;
   const userId = req.user.id; // Ensure userId exists
   console.log("User ID:", userId);
   

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized, user not found in request" });
    }

    // Fetch user attempt from quizzesTaken array
    const user = await User.findById(userId).populate("quizzesTaken.quizId");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Find the specific quiz attempt
    const attempt = user.quizzesTaken.find(q => q.quizId._id.toString() === quizId);

    if (!attempt) {
      return res.status(404).json({ error: "Quiz attempt not found" });
    }

    // Fetch quiz details
    const quiz = attempt.quizId;

    // Calculate points
    const correctAnswers = attempt.answers.filter(a => a.selectedOption === a.correctAnswer).length;
    const wrongAnswers = attempt.answers.length - correctAnswers;
    const correctPoints = correctAnswers * 1;  // Example: 10 points per correct answer
    const wrongPoints = wrongAnswers * 0; // Example: -5 points per wrong answer
    const totalPoints = correctPoints + wrongPoints;

    res.json({
      message: "Quiz result fetched successfully",
      data: {
        id: quiz._id,
        title: quiz.name,
        rating: quiz.rating,
        completionTime: `Completed Quiz On ${new Date(attempt.dateTaken).toDateString()}`,
        attempted: {
          label: "Attempted",
          value: attempt.answers.length
        },
        correctAnswers: {
          label: "Correct Answers",
          value: correctAnswers,
          points: correctPoints
        },
        wrongAnswers: {
          label: "Wrong Answers",
          value: wrongAnswers,
          points: wrongPoints
        },
        overallPoints: {
          label: "Overall Points",
          value: totalPoints
        },
        additionalInfo: "This quiz is a contest type, so results will be declared after the contest ends.",
        solutionInfo: "This Quiz does not contain solutions",
        actions: [
          { label: "Review Answers", action: "/review-answers" },
          { label: "Play Again", action: "/play-again" }
        ]
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Error fetching quiz result", details: error.message });
  }
};

exports.createQuizForBattle = async (req, res) => {
  try {
    const { subject, topic, numberOfQuestions, difficulty, startTime } = req.body;

    if (!subject || !topic || !numberOfQuestions || !difficulty || !startTime) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const prompt = `
    Generate a quiz on the topic "${topic}" under the subject "${subject}".
    Difficulty: "${difficulty}". Total Questions: ${numberOfQuestions}.
    Output the quiz strictly in this JSON format:

    {
      "subjectId": "random_id_here",
      "name": "${topic}",
      "totalPoints": ${numberOfQuestions * 10},
      "rating": 0,
      "duration": ${numberOfQuestions * 2},
      "participants": 0,
      "averageScore": 0,
      "startTime": "${startTime}",
      "endTime": "${new Date(new Date(startTime).getTime() + numberOfQuestions * 2 * 60000).toISOString()}",
      "instructions": [
        "Test your knowledge on ${topic}!",
        "No negative marking."
      ],
      "questions": [
        {
          "question": "Sample question?",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswer": "A",
          "explanation": "Short explanation.",
          "time": "2"
        }
      ]
    }

    Return raw JSON only.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = await response.text();

    text = text.replace(/```json|```/g, "").trim();
    const quizData = JSON.parse(text);

    const {
      subjectId,
      name,
      totalPoints,
      rating,
      duration,
      participants,
      averageScore,
      instructions,
      questions
    } = quizData;

    // 🔽 Save all questions first
    const createdQuestions = await Question.insertMany(
      questions.map(q => ({
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        time: q.time
      }))
    );

    // 🔽 Then save the quiz
    const quiz = new Quiz({
      name,
      totalPoints,
      rating,
      duration,
      participants,
      averageScore,
      instructions,
      totalQuestions: createdQuestions.length,
      questions: createdQuestions.map(q => q._id)
    });

    await quiz.save();

    res.status(201).json({ success: true, message: "Quiz generated & saved", quiz });

  } catch (error) {
    console.error("❌ Error in openAiQuestions:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

