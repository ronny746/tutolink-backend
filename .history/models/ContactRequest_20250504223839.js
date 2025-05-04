const mongoose = require("mongoose");

const contactRequestSchema = new mongoose.Schema({
  name: String,
  email: String,
  mobile: String,
  address: String,
  service: String,
  about: String,
  submittedAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model("ContactRequest", contactRequestSchema);
