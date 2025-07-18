const Note = require("../models/Note");
const axios = require("axios");

const GEMINI_API_KEY = "AIzaSyBPTY0DG69w-GJAjC1LxiwtbzTVMIzACzw";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

exports.askAI = async (req, res) => {
  try {
    const { question } = req.body;

    // 1. Search relevant content from MongoDB
    const notes = await Note.find({ $text: { $search: question } }).limit(3);

    const context = notes.map(n => n.content).join("\n---\n");

    if (!context) return res.json({ answer: "⚠️ No relevant content found." });

    // 2. Send to Gemini with context
    const geminiRes = await axios.post(GEMINI_URL, {
      contents: [
        {
          parts: [
            {
              text: `Use only the following content to answer the question:\n\n${context}\n\nQuestion: ${question}`,
            },
          ],
        },
      ],
    });

    const reply =
      geminiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text || "❌ No answer.";

    res.json({ answer: reply });
  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ error: "Something went wrong." });
  }
};
