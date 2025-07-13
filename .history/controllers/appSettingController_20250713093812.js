const Setting = require('../models/setting');
const User = require('../models/User');
// Create or Update Setting
exports.upsertSetting = async (req, res) => {
  try {
    const data = req.body;

    // Assuming single setting, use a fixed ID or upsert by some field
    const setting = await Setting.findOneAndUpdate({}, data, {
      new: true,
      upsert: true,
    });

    res.status(200).json({ success: true, data: setting });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get Setting
exports.getSetting = async (req, res) => {
  try {
    const setting = await Setting.findOne({});
    res.status(200).json({ success: true, data: setting });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
// Get users for noti
exports.getUsersToken = async (req, res) => {
  try {
    const users = await User.find({}, 'name fcmToken');
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

