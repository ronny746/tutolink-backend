// controllers/aiController.js

const axios = require("axios");

const Note = require("../models/Note");
const Courses = require("../models/classCourse");
const Question = require("../models/questions");
const Subject = require("../models/Subject");
const Quiz = require("../models/Quiz");
const User = require("../models/User");

const GEMINI_API_KEY = "AIzaSyBPTY0DG69w-GJAjC1LxiwtbzTVMIzACzw";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

const allModels = [
  { model: Note, label: "Note" },
  { model: Courses, label: "Syllabus" },
  { model: Question, label: "Chapter" },
  { model: Subject, label: "Subject" },
  { model: Quiz, label: "Topic" },
  { model: Quiz, label: "Topic" },

];

exports.askAI = async (req, res) => {
  try {
    const { question } = req.body;

    let contextParts = [];

    for (const entry of allModels) {
      const docs = await entry.model.find({}).limit(10);
      for (const doc of docs) {
        const content = Object.entries(doc.toObject())
          .filter(([key, val]) => typeof val === "string" && val.trim())
          .map(([key, val]) => `${key}: ${val}`)
          .join("\n");
        if (content) {
          contextParts.push(`${entry.label}:\n${content}`);
        }
      }
    }

    const fullContext = contextParts.join("\n---\n");

    if (!fullContext) {
      return res.status(200).json({
        status: false,
        message: "⚠️ No content found in database.",
        data: null,
      });
    }

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

    const rawReply = geminiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    let response = {
      status: true,
      message: "✅ AI processed your question.",
      data: {
        question: question,
        answer: rawReply.trim(),
      },
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error("AI Error:", error.message);
    res.status(500).json({
      status: false,
      message: "🚨 Internal server error.",
      error: error.message,
    });
  }
};
