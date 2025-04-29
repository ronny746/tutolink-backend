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

cron.schedule("*/5 * * * * *", async () => {
  try {
    const now = new Date();
    const istNow = new Date(now.getTime() + 5.5 * 60 * 60 * 1000); // IST time

    const targetTime = new Date(istNow.getTime() + 4 * 60 * 1000); // 4 mins ahead

    const startRange = new Date(targetTime.getTime() - 30 * 1000); // ±30s buffer
    const endRange = new Date(targetTime.getTime() + 30 * 1000);

    const upcomingBattles = await Battle.find({
      startTime: { $gte: startRange, $lt: endRange },
      status: "Upcoming",
    });

    for (const battle of upcomingBattles) {
      for (const user of battle.participants) {
        // Send and store the notification
        await Notification.create({
          userId: user._id,
          title: "⚔️ Battle Reminder!",
          message: `Your quiz battle is starting in 4 minutes. Battle Code: ${battle.battleCode}`,
          type: "battle",
        });

        // (Optional) push notification logic here if needed
      }
    }

    if (upcomingBattles.length > 0) {
      console.log(`🔔 Sent reminders for ${upcomingBattles.length} battle(s) at ${istNow}`);
    }
  } catch (error) {
    console.error("❌ Error in 4-min reminder job:", error.message);
  }
});