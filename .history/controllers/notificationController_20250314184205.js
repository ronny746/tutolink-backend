const Notification = require("../models/notification");
const User = require("../models/User");
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id; // 🟢 Assume user is authenticated

    // ✅ Get all notifications for the user (sorted by latest first)
    const notifications = await Notification.find({ userId })
      .sort({ c: -1 }); // 🕒 Latest notifications first

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
  




exports.sendNotificationToAll = async (req, res) => {
  try {
    const { title, message, type } = req.body;

    // Validate required fields
    if (!title || !message || !type) {
      return res.status(400).json({ 
        success: false, 
        message: "Title, message, and type are required" 
      });
    }

    // Fetch all users' IDs
    const users = await User.find({}, "_id");

    // Map over users to create notifications array
    const notifications = users.map(user => ({
      userId: user._id,
      title,
      message,
      type,
      isRead: false,
      createdAt: new Date()
    }));

    // Bulk insert notifications for all users
    await Notification.insertMany(notifications);

    res.status(200).json({
      success: true,
      message: "Notifications sent to all users successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error sending notifications",
      details: error.message
    });
  }
};
