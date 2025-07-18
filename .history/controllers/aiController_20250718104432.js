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
      return res.json({ answer: "⚠️ No content found in database." });
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

    const finalReply = rawReply.includes("Yes")
      ? `✅ Yes, we found relevant content for your question. Here's what we found:\n\n${rawReply}`
      : rawReply.includes("No")
      ? `❌ Sorry, we couldn't find anything related to your question.`
      : `🤖 AI Response:\n\n${rawReply}`;

    res.json({ answer: finalReply });
  } catch (error) {
    console.error("AI Error:", error.message);
    res.status(500).json({ error: "Something went wrong." });
  }
};
