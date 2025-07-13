const express = require('express');
const router = express.Router();
const settingController = require('../controllers/appSettingController');

// GET: App settings
router.get('/', settingController.getSetting);

// POST/PUT: Create or update setting
router.post('/', settingController.upsertSetting);

router.get('/getToken', settingController.ge);

module.exports = router;
