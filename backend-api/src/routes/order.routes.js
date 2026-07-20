const express = require('express');
const { validateCheckout } = require('../controllers/checkout.controller');
const { store, index, show, adminIndex, adminShow, updateStatus, cancelOrder, confirmCodPayment } = require('../controllers/order.controller');
const authMiddleware = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');

// Customer routes — mount at /api/orders
const customerRouter = express.Router();
customerRouter.use(authMiddleware);

customerRouter.post('/validate', validateCheckout);
customerRouter.post('/', store);
customerRouter.get('/', index);
customerRouter.get('/:id', show);

// Admin routes — mount at /api/admin/orders
const adminRouter = express.Router();
adminRouter.use(authMiddleware);
adminRouter.use(requireRole(['ADMIN', 'STAFF']));

adminRouter.get('/', adminIndex);
adminRouter.get('/:id', adminShow);
adminRouter.put('/:id/status', updateStatus);
adminRouter.put('/:id/cancel', cancelOrder);
adminRouter.put('/:id/confirm-cod-payment', confirmCodPayment);

module.exports = { customerRouter, adminRouter };
