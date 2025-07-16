const mongoose = require('mongoose');

const QuoteSchema = new mongoose.Schema({
  quoteType: {
    type: String,
    enum: [
      'Inspirational',
      'Motivational',
      'Love',
      'Funny',
      'Wisdom',
      'Success',
      'Life',
      'Friendship',
      'Happiness',
      'Other',
    ],
    required: true,
  },
  quoteText: { type: String, required: true },
  quoteTypeMode: {
    type: Number,
    enum: [1, 2, 3, 4],
    required: true,
  },
  image: { type: String }, // Image URL or path
  status: {
    type: String,
    enum: ['Draft', 'Published', 'Archived', 'Scheduled'],
    required: true,
  },
  time: { type: Date, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Quote', QuoteSchema);
