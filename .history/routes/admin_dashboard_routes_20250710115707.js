const express = require('express');
const router = express.Router();
const { getAdminDashboard } = require('../controllers/admin_controllers/admin_dashboard_controller');

router.get('/dashboard', getAdminDashboard);

module.exports = router;

