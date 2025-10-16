const Quiz = require("../models/Quiz");
const Question = require("../models/questions");
const Subject = require("../models/Subject");
const User = require("../models/User");
const PDFDocument = require('pdfkit');
const moment = require('moment');
const fs = require('fs');

const path = require('path');
const apiKey = 'AIzaSyBNGgBHfErE0yfoiIklRClppDC1IOeYgRQ';
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
// ✅ Upload Quiz with Multiple Questions



exports.uploadQuiz = async (req, res) => {
  try {
    const {
      subjectId,
      questions,
      name,
      totalPoints,
      rating,
      duration,
      participants,
      averageScore,
      instructions,
      type,
      startTime
    } = req.body;

    if (!subjectId || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: "Subject ID and a valid list of questions are required" });
    }

    // ✅ Get subject with classOrCourseId
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({ error: "Subject not found" });
    }

    // ✅ Insert Questions
    const createdQuestions = await Question.insertMany(questions);

    // ✅ Create Quiz
    const quiz = new Quiz({
      subjectId,
      classOrCourseId: subject.classOrCourseId, // fetched from subject
      questions: createdQuestions.map(q => q._id),
      name,
      totalPoints,
      rating,
      totalQuestions: questions.length,
      duration,
      participants,
      averageScore,
      instructions,
      type,
      startTime
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
    const quizzes = await Quiz.find()
      .populate('questions') // populate full question documents
      .populate('subjectId') // populate subject details
      .populate('classOrCourseId'); // populate class or course details

    res.json({
      "success": true,
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

    const doc = new PDFDocument({ 
      margin: 30,
      size: 'A4',
      bufferPages: true
    });
    
    const fileName = `TutoLink_Quiz_${quizId}_${Date.now()}.pdf`;
    const filePath = path.join(__dirname, `../public/reviews/${fileName}`);
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    const colors = {
      primary: '#4A90E2',
      success: '#50C878',
      danger: '#E74C3C',
      dark: '#2C3E50',
      text: '#34495E'
    };

    // Watermark
    const drawWatermark = () => {
      doc.save();
      doc.fontSize(70).fillColor('#000000', 0.03)
        .rotate(-45, { origin: [doc.page.width / 2, doc.page.height / 2] })
        .text('TUTOLINK', 0, doc.page.height / 2, { align: 'center', width: doc.page.width });
      doc.restore();
    };

    // Header
    const drawHeader = () => {
      doc.rect(0, 0, doc.page.width, 4).fill(colors.primary);
    };

    drawWatermark();
    drawHeader();

    // Calculate score
    const totalQuestions = review.length;
    const correctAnswers = review.filter(item => item.selectedOption === item.correctAnswer).length;
    const accuracy = ((correctAnswers / totalQuestions) * 100).toFixed(1);

    // Company name
    doc.fontSize(18).fillColor(colors.primary).font('Helvetica-Bold')
      .text('TUTOLINK', 30, 18, { align: 'center', width: doc.page.width - 60 });
    
    // Title
    doc.fontSize(13).fillColor(colors.dark)
      .text('Quiz Performance Report', 30, 40, { align: 'center', width: doc.page.width - 60 });

    // Student info
    doc.fontSize(8).fillColor(colors.text).font('Helvetica')
      .text(`${user.name} | ${quizDetail.name} | ${moment(takenQuiz.dateTaken).format('DD/MM/YYYY')}`, 
        30, 58, { align: 'center', width: doc.page.width - 60 });

    // Score box
    doc.roundedRect(30, 70, doc.page.width - 60, 38, 3).fill(colors.primary);
    doc.fontSize(18).fillColor('#FFFFFF').font('Helvetica-Bold')
      .text(`${correctAnswers}/${totalQuestions}`, 30, 78, { align: 'center', width: doc.page.width - 60 });
    doc.fontSize(9)
      .text(`${accuracy}% Accuracy`, 30, 96, { align: 'center', width: doc.page.width - 60 });

    // Performance text
    let perfText = accuracy >= 90 ? 'Outstanding Performance' : accuracy >= 75 ? 'Great Job' : accuracy >= 50 ? 'Good Effort' : 'Keep Practicing';
    let perfColor = accuracy >= 75 ? colors.success : accuracy >= 50 ? '#F39C12' : colors.danger;
    doc.fontSize(9).fillColor(perfColor).font('Helvetica-Bold')
      .text(perfText, 30, 115, { align: 'center', width: doc.page.width - 60 });

    // Line separator
    doc.moveTo(30, 130).lineTo(doc.page.width - 30, 130).strokeColor('#DDD').lineWidth(1).stroke();

    let currentY = 138;

    // Questions
    review.forEach((item, idx) => {
      const isCorrect = item.selectedOption === item.correctAnswer;
      
      // Estimate space needed
      const questionHeight = Math.ceil(item.question.length / 85) * 9;
      const optionsHeight = item.options.length * 8;
      const explanationHeight = item.explanation ? Math.ceil(item.explanation.length / 95) * 7 : 0;
      const totalNeeded = questionHeight + optionsHeight + explanationHeight + 28;

      // Check if we need new page
      if (currentY + totalNeeded > doc.page.height - 30) {
        doc.addPage();
        drawWatermark();
        drawHeader();
        currentY = 28;
      }

      // Question number badge
      doc.circle(42, currentY + 4, 7).fill(isCorrect ? colors.success : colors.danger);
      doc.fontSize(7).fillColor('#FFFFFF').font('Helvetica-Bold')
        .text(`${idx + 1}`, 39.5, currentY + 1.5);

      // Question text
      doc.fontSize(8.5).fillColor(colors.dark).font('Helvetica-Bold')
        .text(item.question, 54, currentY, { width: doc.page.width - 84, lineGap: 0 });
      
      currentY = doc.y + 2;

      // Options
      item.options.forEach((opt, i) => {
        const label = String.fromCharCode(65 + i);
        const isSelected = item.selectedOption === opt;
        const isCorrectOpt = item.correctAnswer === opt;
        
        let color = colors.text;
        let font = 'Helvetica';
        let prefix = '';
        
        if (isCorrectOpt) {
          color = colors.success;
          font = 'Helvetica-Bold';
          prefix = '✓ ';
        } else if (isSelected && !isCorrect) {
          color = colors.danger;
          prefix = '✗ ';
        }
        
        doc.fontSize(7.5).fillColor(color).font(font)
          .text(`${prefix}${label}) ${opt}`, 54, currentY, { width: doc.page.width - 84, lineGap: 0 });
        currentY = doc.y + 1.5;
      });

      // Answer line
      currentY += 2;
      doc.fontSize(7).fillColor(colors.text).font('Helvetica')
        .text('Your: ', 54, currentY, { continued: true })
        .fillColor(isCorrect ? colors.success : colors.danger).font('Helvetica-Bold')
        .text(item.selectedOption || 'N/A', { continued: true })
        .fillColor(colors.text).font('Helvetica')
        .text(' | Correct: ', { continued: true })
        .fillColor(colors.success).font('Helvetica-Bold')
        .text(item.correctAnswer);
      
      currentY = doc.y + 2;

      // Explanation
      if (item.explanation) {
        doc.fontSize(7).fillColor(colors.primary).font('Helvetica-Bold')
          .text('Explanation: ', 54, currentY, { continued: true })
          .fillColor(colors.text).font('Helvetica')
          .text(item.explanation, { width: doc.page.width - 84, lineGap: 0 });
        currentY = doc.y + 3;
      }

      // Separator
      currentY += 3;
      doc.moveTo(30, currentY).lineTo(doc.page.width - 30, currentY)
        .strokeColor('#EEE').lineWidth(0.5).stroke();
      currentY += 4;
    });

    // Add footer to all pages after content is done
    // const range = doc.bufferedPageRange();
    for (let i = 0; i < 0; i++) {
      doc.switchToPage(i);
      doc.fontSize(7).fillColor(colors.text, 0.5)
        .text(`TutoLink Quiz Review | ${moment().format('DD/MM/YYYY')}`, 30, doc.page.height - 20, 
          { align: 'center', width: doc.page.width - 60 });
    }

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


    if (!userId) {
      return res.status(401).json({ error: "Unauthorized, user not found in request" });
    }

    // Fetch user attempt from quizzesTaken array
    const user = await User.findById(userId).populate("quizzesTaken.quizId");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Find the specific quiz attempt
    const attempt = user.quizzesTaken.find(q => q.quizId?._id?.toString() === quizId);


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
    const {
      subject,
      subjectId,
      topic,
      numberOfQuestions,
      difficulty,
      startTime
    } = req.body;

    if (!subject || !subjectId || !topic || !numberOfQuestions || !difficulty || !startTime) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const endTime = new Date(
      new Date(startTime).getTime() + numberOfQuestions * 2 * 60000
    ).toISOString();

    const prompt = `
Generate a quiz on the topic "${topic}" under the subject "${subject}".
Difficulty: "${difficulty}". Total Questions: ${numberOfQuestions}.
Output the quiz strictly in this JSON format (raw JSON only):

{
  "subjectId": "${subjectId}",
  "name": "${topic}",
  "totalPoints": ${numberOfQuestions * 10},
  "rating": 0,
  "duration": ${numberOfQuestions * 2},
  "participants": 0,
  "averageScore": 0,
  "startTime": "${startTime}",
  "endTime": "${endTime}",
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
      "time": 2
    }
  ]
}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = await response.text();

    // Remove code block markers if present
    text = text.replace(/```json|```/g, "").trim();

    const quizData = JSON.parse(text);

    const {
      name,
      totalPoints,
      rating,
      duration,
      participants,
      averageScore,
      instructions,
      questions
    } = quizData;

    // Save all questions
    const createdQuestions = await Question.insertMany(
      questions.map(q => ({
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        time: q.time
      }))
    );

    // Save quiz
    const quiz = new Quiz({
      name,
      subjectId,
      totalPoints,
      rating,
      duration,
      participants,
      averageScore,
      instructions,
      totalQuestions: createdQuestions.length,
      questions: createdQuestions.map(q => q._id),
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
    });

    await quiz.save();

    res.status(201).json({
      success: true,
      message: "Quiz generated & saved",
      quiz
    });

  } catch (error) {
    console.error("❌ Error in createQuizForBattle:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};


