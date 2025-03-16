const Notification = require("../modelsn");

exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id; // 🟢 Assume user is authenticated

    // ✅ Get all notifications for the user (sorted by latest first)
    const notifications = await Notification.find({ userId })
      .sort({ date: -1 }); // 🕒 Latest notifications first

    res.json({
      message: "Notifications fetched successfully",
      data: notifications
    });

  } catch (error) {
    res.status(500).json({ error: "Error fetching notifications", details: error.message });
  }
};
