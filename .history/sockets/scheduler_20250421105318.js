const cron = require("node-cron");
const User = require("../models/User");
const CheckIn = require("../models/checkIn");
const Battle = require("../models/quizbattle");
const Notification = require("../models/notification"); // Your FCM/OneSignal logic

// 🔹 1. Daily Score Deduction Job (11:55 PM)
cron.schedule("55 23 * * *", async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);


    const users = await User.find({
      $or: [
        { lastCheckIn: { $lt: today } },
        { lastCheckIn: { $exists: false } }
      ]
    });

    for (const user of users) {
      const penalty = 10;
      user.dailyScore = Math.max(0, (user.dailyScore || 0) - penalty);
      await user.save();

      const missedCheckIn = new CheckIn({
        userId: user._id,
        checkInDate: today,
        pointsEarned: -penalty,
        missedCheckIn: true,
      });
      await missedCheckIn.save();
    }

    console.log("✅ Points deducted for users who missed check-ins today.");
  } catch (error) {
    console.error("❌ Error during daily score reset:", error);
  }
});

// 🔹 2. Battle Reminder Job (Every Minute)
const Battle = require("../models/Battle");
const Notification = require("../models/Notification");
const User = require("../models/User");

setInterval(async () => {
  try {
    console.log(`⏰ Checking for upcoming battles...`);

    const now = new Date();
    const startRange = new Date(now.getTime() + 8 * 60000); // 8 mins from now
    const endRange = new Date(startRange.getTime() + 60000); // 1 minute window

    const upcomingBattles = await Battle.find({
      startTime: { $gte: startRange, $lt: endRange },
      status: "Upcoming"
    }).populate("participants", "deviceToken"); // Ensure we get deviceTokens

    for (const battle of upcomingBattles) {
      for (const user of battle.participants) {
        if (user.deviceToken) {
          // Store in Notification collection
          await Notification.create({
            userId: user._id,
            title: "⚔️ Battle Reminder!",
            message: `Your quiz battle is starting in 8 minutes. Battle Code: ${battle.battleCode}`,
            type: "battle"
          });

          // (Optional) Send push notification using FCM or other service here
        }
      }
    }

    if (upcomingBattles.length > 0) {
      console.log(`🔔 Sent reminders for ${upcomingBattles.length} battle(s).`);
    }
  } catch (error) {
    console.error("❌ Battle Reminder Job Error:", error.message);
  }
}, 5000); // 🔁 Runs every 5 seconds
