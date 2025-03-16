// scheduler.js
const cron = require("node-cron");
const User = require("../models/User");

// Schedule a job to run at midnight every day
cron.schedule("0 0 * * *", async () => {
  try {
    await User.updateMany({}, { dailyScore: 0 });
    console.log("Daily scores reset at midnight");
  } catch (error) {
    console.error("Error resetting daily scores:", error);
  }
});
