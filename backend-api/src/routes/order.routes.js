const express = require('express');
const { validateCheckout } = require('../controllers/checkout.controller');
const { store, index, show, adminIndex, adminShow, updateStatus } = require('../controllers/order.controller');
const authMiddleware = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');

const router = express.Router();

// Customer routes
router.use(authMiddleware);

router.post('/validate', validateCheckout);
router.post('/', store);
router.get('/', index);
router.get('/:id', show);

// Admin routes
router.get('/admin/orders', authMiddleware, requireRole(['ADMIN', 'STAFF']), adminIndex);
router.get('/admin/orders/:id', authMiddleware, requireRole(['ADMIN', 'STAFF']), adminShow);
router.put('/admin/orders/:id/status', authMiddleware, requireRole(['ADMIN', 'STAFF']), updateStatus);

module.exports = router;
