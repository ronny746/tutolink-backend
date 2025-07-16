const express = require('express');
const router = express.Router();
const quoteController = require('../controllers/admin_controllers/quotes_controller');

router.post('/create', quoteController.createQuote);
router.get('/', quoteController.getQuotes);
router.get('/today', quoteController.getTodayQuote);

router.get('/enums', quoteController.getEnums); // optional but useful for dropdowns

module.exports = router;
