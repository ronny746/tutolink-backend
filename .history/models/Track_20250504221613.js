const mongoose = require("mongoose");

const trackSchema = new mongoose.Schema({
  ipAddress: String,
  userAgent: String,
  visitedAt: Date,
  country: String,
  countryCode: String,
  region: String,
  regionName: String,
  city: String,
  zip: String,
  lat: Number,
  lon: Number,
  timezone: String,
  isp: String,
  org: String,
  as: String
});

module.exports = mongoose.model("Track", trackSchema);
