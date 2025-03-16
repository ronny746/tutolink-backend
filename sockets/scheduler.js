const cron = require("node-cron");
const User = require("../models/User");
const CheckIn = require("../models/checkIn");

// Schedule the job to run every day at 11:55 PM
cron.schedule("33 10 * * *", async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to midnight (start of the day)

    const users = await User.find({
      $or: [
        { lastCheckIn: { $lt: today } }, // Last check-in before today
        { lastCheckIn: { $exists: false } } // Never checked in
      ]
    });

    for (const user of users) {
      // Deduct 10 points from dailyScore only, ensuring it doesn't go negative
      let penalty = 10;
      user.dailyScore = Math.max(0, (user.dailyScore || 0) - penalty);
      await user.save();

      // Record the missed check-in in the history
      const missedCheckIn = new CheckIn({
        userId: user._id,
        checkInDate: today,
        pointsEarned: -penalty,
        missedCheckIn: true,
      });
      await missedCheckIn.save();
    }

    console.log("Points deducted for users who missed check-ins today.");
  } catch (error) {
    console.error("Error during daily score reset:", error);
  }
});
