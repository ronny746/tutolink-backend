const express = require('express');
const router = express.Router();
const quoteController = require('../controllers/');

router.post('/create', quoteController.createQuote);
router.get('/', quoteController.getQuotes);
router.get('/enums', quoteController.getEnums); // optional but useful for dropdowns

module.exports = router;
