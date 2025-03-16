// controllers/dailyCheckInController.js

const User = require("../models/User");

exports.dailyCheckIn = async (req, res) => {
  try {
    // Assume req.user.id is available from your authentication middleware
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get today's date (set hours, minutes, seconds, ms to 0 for comparison)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if the user already checked in today
    if (user.lastCheckIn) {
      const lastCheckIn = new Date(user.lastCheckIn);
      lastCheckIn.setHours(0, 0, 0, 0);
      if (lastCheckIn.getTime() === today.getTime()) {
        return res.status(200).json({
          message: "Already checked in today",
          dailyScore: user.dailyScore
        });
      }
    }

    // Otherwise, perform the check-in
    user.lastCheckIn = new Date(); // Save current time
    user.dailyScore = 10; // Award 10 points (or any value you choose)
    await user.save();

    res.status(200).json({
      message: "Check-in successful",
      dailyScore: user.dailyScore
    });
  } catch (error) {
    res.status(500).json({ message: "Error during check-in", error: error.message });
  }
};
