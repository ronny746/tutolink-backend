const cron = require("node-cron");
const User = require(".//models/User");

// Schedule a job to run every day at 5:44 PM
cron.schedule("44 17 * * *", async () => {
  try {
    // Get today's date at midnight (start of the day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Update only those users who haven't checked in today
    // (lastCheckIn is either null or less than today's date)
    await User.updateMany(
      {
        $or: [
          { lastCheckIn: { $lt: today } },
          { lastCheckIn: { $exists: false } }
        ]
      },
      { dailyScore: 0 }
    );
    console.log("Daily scores reset at 5:44 PM for users who haven't checked in today");
  } catch (error) {
    console.error("Error resetting daily scores:", error);
  }
});
