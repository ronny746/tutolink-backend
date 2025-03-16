const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema({
    question: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctAnswer: { type: String, required: true },
    explanation: { type: String, required: false },
    time: { type: Number, required: false }, // Time limit in seconds
    questionImage: { type: String, required: false }, // URL for question image
    explanationImage: { type: String, required: false }, // URL for explanation image
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Question", QuestionSchema);
