const Onboarding = require("../models/");

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
    const { title, boldTitle, subtitle, description, image } = req.body;

    if (!title || !boldTitle || !subtitle || !description || !image) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const newScreen = new Onboarding({ title, boldTitle, subtitle, description, image });
    await newScreen.save();

    res.status(201).json({ success: true, message: "Onboarding screen added successfully", data: newScreen });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};
