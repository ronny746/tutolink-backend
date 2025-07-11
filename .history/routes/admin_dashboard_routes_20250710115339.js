const express = require('express');
const router = express.Router();
const { getAdminDashboard } = require('../controllers/');

router.get('/dashboard', getAdminDashboard);

module.exports = router;
