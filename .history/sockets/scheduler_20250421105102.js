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
cron.schedule("* * * * *", async () => {
  try {
    console.log(`Hi`);

    const now = new Date();
    const nextMinute = new Date(now.getTime() + 60000); // 1 minute range

    // Calculate time range 8 minutes before the battle
    const startRange = new Date(now.getTime() + 8 * 60000);
    const endRange = new Date(nextMinute.getTime() + 8 * 60000);

    const upcomingBattles = await Battle.find({
      startTime: { $gte: startRange, $lt: endRange },
      status: "Upcoming",
    });
    
    for (const battle of upcomingBattles) {
      for (const user of battle.participants) {
        if (user.deviceToken) {
          await Notification.create({
            userId: user._id,
            title: "⚔️ Battle Reminder!",
            message: "Your quiz battle is starting in 5 minutes. Battle Code: ${battle.battleCode}",
            type: 'battle'
          });

        }
      }
    }

    if (upcomingBattles.length > 0) {
      console.log(`🔔 Sent battle reminders for ${upcomingBattles.length} battle(s).`);
    }
  } catch (error) {
    console.error("❌ Battle Reminder Job Error:", error);
  }
});
