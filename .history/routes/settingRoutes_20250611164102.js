const express = require('express');
const router = express.Router();
const settingController = require('../controllers/s');

// GET: App settings
router.get('/', settingController.getSetting);

// POST/PUT: Create or update setting
router.post('/', settingController.upsertSetting);

module.exports = router;
