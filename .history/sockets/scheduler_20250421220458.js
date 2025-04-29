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

// cron.schedule("*/5 * * * * *", async () => {
//   try {
//     const upcomingBattles = await Battle.find({ status: "Upcoming" });

//     // for (const battle of upcomingBattles) {
//     //   for (const user of battle.participants) {
//     //     await Notification.create({
//     //       userId: user._id,
//     //       title: "⚔️ Upcoming Battle!",
//     //       message: `A new quiz battle is waiting for you! Battle Code: ${battle.battleCode}`,
//     //       type: "battle",
//     //     });

//     //     // Optional: Add push notification here if needed
//     //   }
//     // }

//     // console.log(`🔔 Sent notifications to all participants of ${upcomingBattles.length} upcoming battle(s).`);
//   } catch (error) {
//     console.error("❌ Error sending battle notifications:", error.message);
//   }
// });