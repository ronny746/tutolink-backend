// controllers/aiController.js

const axios = require("axios");

const Note = require("../models/Note");
const Courses = require("../models/classCourse");
const Question = require("../models/questions");
const Subject = require("../models/Subject");
const Quiz = require("../models/Quiz");

const GEMINI_API_KEY = "AIzaSyBPTY0DG69w-GJAjC1LxiwtbzTVMIzACzw";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

const allModels = [
  { model: Note, label: "Note" },
  { model: Courses, label: "Syllabus" },
  { model: Question, label: "Chapter" },
  { model: Subject, label: "Subject" },
  { model: Quiz, label: "Topic" },
];

exports.askAI = async (req, res) => {
  try {
    const { question } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({
        status: false,
        message: "❗ Question is required.",
        data: null,
      });
    }

    let contextParts = [];

    for (const entry of allModels) {
      const docs = await entry.model.find({}).limit(10);
      for (const doc of docs) {
        const contentLines = Object.entries(doc.toObject())
          .filter(([_, val]) => typeof val === "string" && val.trim())
          .map(([key, val]) => `${key}: ${val}`);
        if (contentLines.length) {
          contextParts.push({
            type: entry.label,
            content: contentLines.join("\n"),
          });
        }
      }
    }

    if (!contextParts.length) {
      return res.status(200).json({
        status: false,
        message: "⚠️ No content found in database.",
        data: null,
      });
    }

    const fullContext = contextParts
      .map((section) => `${section.type}:\n${section.content}`)
      .join("\n---\n");

    const geminiRes = await axios.post(GEMINI_URL, {
      contents: [
        {
          parts: [
            {
              text: `Use ONLY the following content to answer the question:\n\n${fullContext}\n\nQuestion: ${question}`,
            },
          ],
        },
      ],
    });

    const aiText = geminiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

    const lower = aiText.toLowerCase();
    const responseType = lower.includes("yes")
      ? "✅ Relevant content found for your question."
      : lower.includes("no")
      ? "❌ No relevant content found for your question."
      : "🤖 AI processed your question.";

    return res.status(200).json({
      status: true,
      message: responseType,
      data: {
        question,
        answer: aiText,
        sources: contextParts.map(({ type, content }) => ({ type, content })),
      },
    });
  } catch (error) {
    console.error("AI Error:", error.message);
    return res.status(500).json({
      status: false,
      message: "🚨 Internal server error.",
      error: error.message,
    });
  }
};
