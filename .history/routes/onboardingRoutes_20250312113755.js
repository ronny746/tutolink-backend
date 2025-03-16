const express = require("express");
const { getOnboardingScreens, addOnboardingScreen } = require("../controllers/");

const router = express.Router();

// ✅ Route to get all onboarding data
router.get("/onboarding", getOnboardingScreens);

// ✅ Route to add a new onboarding screen
router.post("/onboarding", addOnboardingScreen);

module.exports = router;
