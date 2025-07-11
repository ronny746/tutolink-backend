const express = require('express');
const router = express.Router();
const { getAdminDashboard } = require('../controllers/admin_controllers/');

router.get('/dashboard', getAdminDashboard);

module.exports = router;
