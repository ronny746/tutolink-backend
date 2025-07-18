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
    { model: User, label: "User Data", priority: 1 },
    { model: Note, label: "Notes", priority: 1 },
    { model: Courses, label: "Course Syllabus", priority: 1 },
    { model: Question, label: "Chapter Questions", priority: 1 },
    { model: Subject, label: "Subject Information", priority: 1 },
    { model: Quiz, label: "Quiz Topics", priority: 1 },

];

// Helper function to clean and format text
const cleanText = (text) => {
    return text.replace(/\s+/g, ' ').trim();
};

// Helper function to get relevant context based on question keywords
const getRelevantContext = async (question) => {
    const questionLower = question.toLowerCase();
    const keywords = questionLower.split(/\s+/);

    let contextParts = [];
    let totalLength = 0;
    const maxContextLength = 8000; // Limit context to avoid API limits

    // Sort models by priority for better context relevance
    const sortedModels = allModels.sort((a, b) => a.priority - b.priority);

    for (const entry of sortedModels) {
        if (totalLength >= maxContextLength) break;

        try {
            // Get more relevant documents based on question context
            const docs = await entry.model.find({}).limit(15);

            for (const doc of docs) {
                if (totalLength >= maxContextLength) break;

                const docObj = doc.toObject();
                const content = Object.entries(docObj)
                    .filter(([key, val]) => {
                        // Skip internal fields and empty values
                        if (key.startsWith('_') || key === '__v') return false;
                        if (typeof val !== 'string' || !val.trim()) return false;
                        return true;
                    })
                    .map(([key, val]) => {
                        const cleanKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                        return `${cleanKey}: ${cleanText(val)}`;
                    })
                    .join('\n');

                if (content) {
                    const contextEntry = `=== ${entry.label} ===\n${content}\n`;

                    // Check if this content is relevant to the question
                    const contentLower = content.toLowerCase();
                    const relevanceScore = keywords.reduce((score, keyword) => {
                        return score + (contentLower.includes(keyword) ? 1 : 0);
                    }, 0);

                    if (relevanceScore > 0 || contextParts.length < 3) {
                        contextParts.push({ content: contextEntry, relevance: relevanceScore });
                        totalLength += contextEntry.length;
                    }
                }
            }
        } catch (modelError) {
            console.warn(`Warning: Could not fetch data from ${entry.label}:`, modelError.message);
        }
    }

    // Sort by relevance and return top contexts
    return contextParts
        .sort((a, b) => b.relevance - a.relevance)
        .map(item => item.content)
        .join('\n');
};

// Enhanced prompt for better AI responses
const createEnhancedPrompt = (context, question) => {
    return `You are an intelligent educational assistant. Use the provided educational content to answer the student's question comprehensively and helpfully.

EDUCATIONAL CONTENT:
${context}

INSTRUCTIONS:
1. Answer the question directly and clearly
2. Use information from the provided content only
3. If the answer requires information not in the content, clearly state what information is missing
4. Structure your response in a student-friendly way
5. Provide examples when possible
6. If it's a complex topic, break it down into simple steps

STUDENT'S QUESTION: ${question}

RESPONSE:`;
};

exports.askAI = async (req, res) => {
    try {
        // Input validation
        const { question } = req.body;

        if (!question || typeof question !== 'string') {
            return res.status(400).json({
                status: false,
                message: "❌ Please provide a valid question.",
                data: null,
                error: "Question is required and must be a string"
            });
        }

        const trimmedQuestion = question.trim();
        if (trimmedQuestion.length < 3) {
            return res.status(400).json({
                status: false,
                message: "❌ Question is too short. Please provide more details.",
                data: null,
            });
        }

        if (trimmedQuestion.length > 1000) {
            return res.status(400).json({
                status: false,
                message: "❌ Question is too long. Please keep it under 1000 characters.",
                data: null,
            });
        }

        // Get relevant context
        console.log("Fetching relevant context for question:", trimmedQuestion);
        const relevantContext = await getRelevantContext(trimmedQuestion);

        if (!relevantContext) {
            return res.status(200).json({
                status: false,
                message: "⚠️ No relevant educational content found in the database for your question.",
                data: {
                    question: trimmedQuestion,
                    answer: "I don't have enough information in the database to answer your question. Please make sure your question is related to your course content, or try rephrasing it.",
                    suggestion: "Try asking about topics covered in your notes, courses, or study materials."
                },
            });
        }

        // Create enhanced prompt
        const enhancedPrompt = createEnhancedPrompt(relevantContext, trimmedQuestion);

        // Make API call to Gemini
        console.log("Making request to Gemini API...");
        const geminiRes = await axios.post(
            GEMINI_URL,
            {
                contents: [
                    {
                        parts: [{ text: enhancedPrompt }],
                    },
                ],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 1024,
                },
            },
            {
                timeout: 30000, // 30 second timeout
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        const rawReply = geminiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

        if (!rawReply.trim()) {
            return res.status(200).json({
                status: false,
                message: "⚠️ Unable to generate a response. Please try rephrasing your question.",
                data: {
                    question: trimmedQuestion,
                    answer: "I couldn't generate a proper response to your question. Please try asking in a different way.",
                },
            });
        }

        // Format the response
        const formattedAnswer = cleanText(rawReply);

        // Success response
        const response = {
            status: true,
            message: "✅ Your question has been answered successfully!",
            data: {
                question: trimmedQuestion,
                answer: formattedAnswer,
                timestamp: new Date().toISOString(),
                responseLength: formattedAnswer.length,
            },
            metadata: {
                processingTime: Date.now(),
                contextSources: allModels.map(m => m.label),
            }
        };

        console.log("AI response generated successfully");
        return res.status(200).json(response);

    } catch (error) {
        console.error("AI Controller Error:", error);

        // Handle specific error types
        let errorMessage = "🚨 Something went wrong while processing your question.";
        let statusCode = 500;

        if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
            errorMessage = "⏰ Request timed out. Please try again.";
            statusCode = 408;
        } else if (error.response?.status === 429) {
            errorMessage = "⏳ Too many requests. Please wait a moment and try again.";
            statusCode = 429;
        } else if (error.response?.status === 401) {
            errorMessage = "🔐 Authentication error. Please contact support.";
            statusCode = 401;
        } else if (error.response?.status >= 400 && error.response?.status < 500) {
            errorMessage = "❌ Invalid request. Please check your question and try again.";
            statusCode = 400;
        }

        res.status(statusCode).json({
            status: false,
            message: errorMessage,
            data: null,
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            timestamp: new Date().toISOString(),
        });
    }
}; isme add kro jo n mile use internet se do