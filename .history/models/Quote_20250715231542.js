const mongoose = require('mongoose');

const QuoteSchema = new mongoose.Schema({
  quoteType: { type: String, required: true },
  quoteText: { type: String, required: true },
  image: { type: String }, // store image URL or path
  status: { type: String, enum: ['Published', 'Draft'], required: true },
  time: { type: Date, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Quote', QuoteSchema);
