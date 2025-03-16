const mongoose = require("mongoose");

const checkInSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  checkInDate: { type: Date, default: Date.now },
  pointsEarned: { type: Number, default: 10 },
  missedCheckIn: { type: Boolean, default: false }, // Track if it's a missed check-in
  reason: { type: String, default: "Daily Check-In" } // Reason for the points
});

const CheckIn = mongoose.model("CheckIn", checkInSchema);
module.exports = CheckIn;
