const express = require('express');
const {
  updatePrice,
  bulkUpdatePrices,
  listPrices,
  getPriceHistory,
} = require('../controllers/price.controller');
const authMiddleware = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');

const router = express.Router();

// Apply auth/role middleware globally to this router
router.use(authMiddleware);
router.use(requireRole(['ADMIN', 'STAFF']));

router.get('/prices', listPrices);
router.put('/variants/:id/price', updatePrice);
router.put('/prices/bulk', bulkUpdatePrices);
router.get('/variants/:id/price-history', getPriceHistory);

module.exports = router;
