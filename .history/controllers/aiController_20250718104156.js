const axios = require("axios");

// 🔹 Import all models
const Note = require("../models/Note");
const Courses = require("../models/classCourse");
const Question = require("../models/questions");
const Subject = require("../models/Subject");
const Quiz = require("../models/Quiz");
// 🔁 Add remaining 10 models here (as per your 15-schema setup)

// 🔹 Gemini API setup
const GEMINI_API_KEY = "AIzaSyBPTY0DG69w-GJAjC1LxiwtbzTVMIzACzw";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

// 🔹 Add all models to this list
const allModels = [
  { model: Note, label: "Note" },
  { model: Courses, label: "Syllabus" },
  { model: Question, label: "Chapter" },
  { model: Subject, label: "Subject" },
  { model: Quiz, label: "Topic" },
  // 🔁 Add your remaining models here in the same way
];

exports.askAI = async (req, res) => {
  try {
    const { question } = req.body;

    let contextParts = [];

    for (const entry of allModels) {
      const docs = await entry.model.find({}).limit(10); // optional limit

      docs.forEach((doc) => {
        const data = doc.toObject();
        const content = Object.entries(data)
          .filter(([key, val]) => key !== "__v" && key !== "_id")
          .map(([key, val]) => `${key}: ${val}`)
          .join("\n");

        if (content) {
          contextParts.push(`${entry.label}:\n${content}`);
        }
      });
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

    const reply =
      geminiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text || "❌ No answer.";

    res.json({ answer: reply });
  } catch (error) {
    console.error("AI Error:", error.message);
    res.status(500).json({ error: "Something went wrong." });
  }
};
