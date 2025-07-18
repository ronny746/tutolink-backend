// controllers/aiController.js
const axios = require("axios");
const Note = require("../models/Note");
const Courses = require("../models/classCourse");
const Question = require("../models/questions");
const Subject = require("../models/Subject");
const Quiz = require("../models/Quiz");
const User = require("../models/User");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "AIzaSyBPTY0DG69w-GJAjC1LxiwtbzTVMIzACzw";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

const allModels = [
//   { model: User, label: "User Data", priority: 1 },
//   { model: Note, label: "Notes", priority: 1 },
//   { model: Courses, label: "Course Syllabus", priority: 1 },
  { model: Question, label: "Questions", priority: 1 },
//   { model: Subject, label: "Subject Information", priority: 1 },
//   { model: Quiz, label: "Quiz Topics", priority: 1 },
];

// Clean up whitespace
const cleanText = (text) => text.replace(/\s+/g, " ").trim();

// Fallback: ask Gemini online (no context)
const getWebAnswerFallback = async (question) => {
  const prompt = `You are a helpful assistant. Answer the question clearly and accurately:\n\nQuestion: ${question}\n\nAnswer:`;
  const res = await axios.post(
    GEMINI_URL,
    {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    },
    { headers: { "Content-Type": "application/json" }, timeout: 30000 }
  );
  return res.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
};

// Gather DB-based context
const getRelevantContext = async (question) => {
  const keywords = question.toLowerCase().split(/\s+/);
  let contextParts = [];
  let totalLen = 0;
  const maxLen = 8000;

  for (const entry of allModels.sort((a, b) => a.priority - b.priority)) {
    if (totalLen >= maxLen) break;
    let docs;
    try {
      docs = await entry.model.find({}).limit(15);
    } catch {
      continue;
    }
    for (const doc of docs) {
      if (totalLen >= maxLen) break;
      const obj = doc.toObject();
      const lines = Object.entries(obj)
        .filter(([k,v]) => !k.startsWith("_") && typeof v === "string" && v.trim())
        .map(([k,v]) => `${k.charAt(0).toUpperCase() + k.slice(1)}: ${cleanText(v)}`);
      if (!lines.length) continue;

      const block = `=== ${entry.label} ===\n${lines.join("\n")}\n`;
      const score = keywords.reduce((s, kw) => s + (block.toLowerCase().includes(kw) ? 1 : 0), 0);
      if (score > 0 || contextParts.length < 3) {
        contextParts.push({ block, score });
        totalLen += block.length;
      }
    }
  }

  return contextParts
    .sort((a, b) => b.score - a.score)
    .map((c) => c.block)
    .join("\n");
};

// Build prompt when we have context
const createEnhancedPrompt = (context, question) => `
You are an intelligent educational assistant. Use ONLY the content below to answer the question clearly.

CONTENT:
${context}

Question: ${question}

Answer:`.trim();

exports.askAI = async (req, res) => {
  try {
    const { question } = req.body;
    if (!question || typeof question !== "string" || question.trim().length < 3) {
      return res.status(400).json({
        status: false,
        message: "❌ Please provide a valid question (3–1000 chars).",
        data: null,
      });
    }
    const q = question.trim();
    // 1) Try DB context
    const ctx = await getRelevantContext(q);

    let prompt, source;
    if (!ctx) {
      // 2) Fallback to web
      prompt = `Answer using your general knowledge:\n\nQuestion: ${q}\n\nAnswer:`;
      source = "web";
    } else {
      prompt = createEnhancedPrompt(ctx, q);
      source = "context";
    }

    // 3) Call Gemini
    const aiRes = await axios.post(
      GEMINI_URL,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, topK: 40, topP: 0.95, maxOutputTokens: 1024 },
      },
      { headers: { "Content-Type": "application/json" }, timeout: 30000 }
    );
    const raw = aiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!raw.trim()) {
      return res.status(200).json({
        status: false,
        message: "⚠️ Could not generate an answer. Try rephrasing.",
        data: { question: q, answer: "" },
      });
    }

    // 4) Return structured JSON
    return res.status(200).json({
      status: true,
      message:
        source === "context"
          ? "✅ Answered using your database content."
          : "🌐 Answered using internet-based AI knowledge.",
      data: {
        question: q,
        answer: cleanText(raw),
        source,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("AI Controller Error:", err.message);
    let msg = "🚨 Internal server error.";
    let code = 500;
    if (err.code === "ECONNABORTED" || err.code === "ETIMEDOUT") {
      msg = "⏰ Request timed out. Please try again.";
      code = 408;
    } else if (err.response?.status === 429) {
      msg = "⏳ Too many requests. Try again later.";
      code = 429;
    }
    return res.status(code).json({ status: false, message: msg, data: null });
  }
};
