const express = require("express");
const upload = require("../config/widdlware");
const { getOnboardingScreens, addOnboardingScreen } = require("../controllers/onboardingController");

const router = express.Router();

// ✅ Route to get all onboarding data
router.get("/onboarding", getOnboardingScreens);

// ✅ Route to add a new onboarding screen
router.post("/add", upload.single("file"), addOnboardingScreen);

module.exports = router;
