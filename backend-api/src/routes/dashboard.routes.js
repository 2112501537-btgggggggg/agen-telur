const express = require('express');
const { getDashboardSummary, salesReport, damagedReport } = require('../controllers/dashboard.controller');
const authMiddleware = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');

const router = express.Router();

router.get('/dashboard/summary', authMiddleware, requireRole(['ADMIN', 'STAFF']), getDashboardSummary);
router.get('/dashboard/sales-report', authMiddleware, requireRole(['ADMIN', 'STAFF']), salesReport);
router.get('/dashboard/damaged-report', authMiddleware, requireRole(['ADMIN', 'STAFF']), damagedReport);

module.exports = router;
