// models/Track.js
const mongoose = require("mongoose");

const trackSchema = new mongoose.Schema({
  ipAddress: String,
  userAgent: String,
  visitedAt: Date
});

module.exports = mongoose.model("Track", trackSchema);
