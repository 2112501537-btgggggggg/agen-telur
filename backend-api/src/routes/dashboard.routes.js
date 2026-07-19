const express = require('express');
const { getDashboardSummary } = require('../controllers/dashboard.controller');
const authMiddleware = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');

const router = express.Router();

router.get('/dashboard/summary', authMiddleware, requireRole(['ADMIN', 'STAFF']), getDashboardSummary);

module.exports = router;
