const Onboarding = require("../models/onboading");
const { v4: uuidv4 } = require("uuid");
const { bucket } = require("../config/firebase");
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
    const file = req.file;

    if (!file) return res.status(400).json({ error: "No file uploaded" });
    const { title, boldTitle, subtitle, description } = req.body;
    const fileId = uuidv4();
    const fileUpload = bucket.file(`onboarding/${fileId}-${file.originalname}`);

    await fileUpload.save(file.buffer, { contentType: file.mimetype });

    const [url] = await fileUpload.getSignedUrl({ action: "read", expires: "01-01-2030" });

    if (!title || !boldTitle || !subtitle || !description || !url) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const newScreen = new Onboarding({ title, boldTitle, subtitle, description, url });
    await newScreen.save();

    res.status(201).json({ success: true, message: "Onboarding screen added successfully", data: newScreen });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};
