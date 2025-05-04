const mongoose = require("mongoose");

const trackSchema = new mongoose.Schema({
  ipAddress: String,
  userAgent: String,
  visitedAt: Date,
  country: String,
  countryCode: String,
  region: String,
  city: String
});

module.exports = mongoose.model("Track", trackSchema);
