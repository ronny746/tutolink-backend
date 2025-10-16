const Onboarding = require("../models/onboading");
const { v4: uuidv4 } = require("uuid");
const { bucket } = require("../config/firebase");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ✅ Get All Onboarding Screens
exports.getOnboardingScreens = async (req, res) => {
  try {
    const screens = await Onboarding.find();
    res.status(200).json({ success: true, data: screens });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// ✅ Add New Onboarding Screen
exports.addOnboardingScreen = async (req, res) => {
  try {
    const { title, boldTitle, subtitle, description } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ error: "No file uploaded" });
    if (!title || !boldTitle || !subtitle || !description) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Ensure upload directory exists
    const uploadDir = path.join(__dirname, "../uploads/onboarding");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    // Generate a unique filename and move/rename file
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    const filepath = path.join(uploadDir, filename);

    if (file.path) {
      fs.renameSync(file.path, filepath);
    } else if (file.buffer) {
      fs.writeFileSync(filepath, file.buffer);
    } else {
      return res.status(400).json({ error: "File data is missing" });
    }

    // Generate public URL
    const imageUrl = `${req.protocol}://${req.get("host")}/uploads/onboarding/${filename}`;

    // Save to database
    const newScreen = new Onboarding({
      title,
      boldTitle,
      subtitle,
      description,
      image: imageUrl,
    });

    await newScreen.save();

    res.status(201).json({
      success: true,
      message: "Onboarding screen added successfully",
      data: newScreen,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error adding onboarding screen", details: err.message });
  }
};