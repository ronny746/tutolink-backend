const Quote = require('../../models/Quote');

const validQuoteTypes = [
  'Inspirational', 'Motivational', 'Love', 'Funny', 'Wisdom',
  'Success', 'Life', 'Friendship', 'Happiness', 'Other',
];

const validStatuses = ['Draft', 'Published', 'Archived', 'Scheduled'];

// Create Quote
exports.createQuote = async (req, res) => {
  try {
    const { quoteType, quoteText, quoteTypeMode, image, status, time } = req.body;

    if (!quoteType || !quoteText || !status || !time || quoteTypeMode === undefined) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (!validQuoteTypes.includes(quoteType)) {
      return res.status(400).json({ message: 'Invalid quote type' });
    }

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    if (![1, 2, 3, 4].includes(quoteTypeMode)) {
      return res.status(400).json({ message: 'Invalid quoteTypeMode' });
    }

    const newQuote = new Quote({ quoteType, quoteText, quoteTypeMode, image, status, time });
    await newQuote.save();

    res.status(201).json({ message: 'Quote created', quote: newQuote });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get All Quotes
exports.getQuotes = async (req, res) => {
  try {
    const quotes = await Quote.find().sort({ createdAt: -1 });
    res.status(200).json({ quotes });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getTodayQuotes = async (req, res) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0); // Today 00:00

    const end = new Date();
    end.setHours(23, 59, 59, 999); // Today 23:59

    const quotes = await Quote.find({
      time: { $gte: start, $lte: end }
    }).sort({ time: -1 });

    res.status(200).json({ quotes });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};


// Get Enums (for frontend dropdowns)
exports.getEnums = (req, res) => {
  res.status(200).json({
    quoteTypes: validQuoteTypes,
    statusOptions: validStatuses,
  });
};
