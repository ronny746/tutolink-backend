// controllers/aiController.js

const axios = require("axios");

// 🔹 Import all models
const Note = require("../models/Note");
const Courses = require("../models/classCourse");
const Question = require("../models/questions");
const Subject = require("../models/Subject");
const Quiz = require("../models/Quiz");
// 🔁 Add all your other models here

// 🔹 Gemini Setup
const GEMINI_API_KEY = "AIzaSyBPTY0DG69w-GJAjC1LxiwtbzTVMIzACzw";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

// 🔹 Model List with optional formatting
const allModels = [
  { model: Note, label: "Note", fields: ["title", "content"] },
  { model: Courses, label: "Syllabus", fields: ["title", "details"] },
  { model: Question, label: "Chapter", fields: ["name", "description"] },
  { model: Subject, label: "Subject", fields: ["name", "description"] },
  { model: Quiz, label: "Topic", fields: ["name", "content"] },
  // 🔁 Add more with relevant fields
];

exports.askAI = async (req, res) => {
  try {
    const { question } = req.body;

    let contextParts = [];

    // 🔹 Loop through all models
    for (const entry of allModels) {
      const docs = await entry.model.find({}).limit(10); // Optional: .limit(10)
      for (const doc of docs) {
        const content = entry.fields.map(f => doc[f]).filter(Boolean).join("\n");
        if (content) {
          contextParts.push(`${entry.label}:\n${content}`);
        }
      }
    }

    const fullContext = contextParts.join("\n---\n");

    if (!fullContext) {
      return res.json({ answer: "⚠️ No content found in database." });
    }

    // 🔹 Send to Gemini
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

    const reply =
      geminiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text || "❌ No answer.";

    res.json({ answer: reply });
  } catch (error) {
    console.error("AI Error:", error.message);
    res.status(500).json({ error: "Something went wrong." });
  }
};
