const mongoose = require("mongoose");

const checkInSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  checkInDate: { type: Date, default: Date.now }, // Record each check-in date
  pointsEarned: { type: Number, default: 10 },    // Points awarded for the check-in
});

const CheckIn = mongoose.model("CheckIn", checkInSchema);
module.exports = CheckIn;
