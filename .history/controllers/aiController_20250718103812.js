const Note = require("../models/Note");
const Syllabus = require("../models/Syllabus");
const Chapter = require("../models/Chapter");
const axios = require("axios");

const GEMINI_API_KEY = "AIzaSyBPTY0DG69w-GJAjC1LxiwtbzTVMIzACzw";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

exports.askAI = async (req, res) => {
  try {
    const { question } = req.body;

    // 🔹 Step 1: Fetch data from all collections
    const [notes, syllabi, chapters] = await Promise.all([
      Note.find({}),
      Syllabus.find({}),
      Chapter.find({})
    ]);

    // 🔹 Step 2: Combine content from all
    const context = [
      ...notes.map(n => `Note: ${n.title}\n${n.content}`),
      ...syllabi.map(s => `Syllabus: ${s.title}\n${s.details}`),
      ...chapters.map(c => `Chapter: ${c.name}\n${c.description}`)
    ].join("\n---\n");

    if (!context) return res.json({ answer: "⚠️ No content found in DB." });

    // 🔹 Step 3: Send to Gemini
    const geminiRes = await axios.post(GEMINI_URL, {
      contents: [
        {
          parts: [
            {
              text: `Use ONLY the following data from the database to answer the question:\n\n${context}\n\nQuestion: ${question}`,
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
