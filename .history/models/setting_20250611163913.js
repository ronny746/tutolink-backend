const mongoose = require("mongoose");

const SettingSchema = new mongoose.Schema({
    appName: { type: String, required: true },
    version: { type: String, required: true },
    imageUrl: { type: String, required: true }, // Image URL for slider
    redirectUrl: { type: String, required: false }, // Optional: URL to redirect when clicked
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Setting", SettingSchema);
