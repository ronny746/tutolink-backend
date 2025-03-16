const Notification = require("../models/notification");

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

exports.markAsRead = async (req, res) => {
    try {
      const { notificationId } = req.body;
  
      const notification = await Notification.findByIdAndUpdate(
        notificationId,
        { isRead: true },
        { new: true }
      );
  
      if (!notification) {
        return res.status(404).json({ error: "Notification not found" });
      }
  
      res.json({ message: "Notification marked as read", data: notification });
  
    } catch (error) {
      res.status(500).json({ error: "Error updating notification", details: error.message });
    }
  };
  