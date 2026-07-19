const { updatePriceSchema, bulkUpdatePriceSchema } = require('../validators/price.validator');
const priceService = require('../services/price.service');
const asyncHandler = require('../utils/asyncHandler');

const updatePrice = asyncHandler(async (req, res) => {
    const variantId = parseInt(req.params.id, 10);
    if (isNaN(variantId)) {
      return res.status(400).json({ success: false, message: 'ID varian tidak valid' });
    }

    const validated = updatePriceSchema.parse(req.body);
    const updated = await priceService.updateVariantPrice(variantId, validated.newPrice, req.user.id);
    res.status(200).json({ success: true, data: updated });
});

const bulkUpdatePrices = asyncHandler(async (req, res) => {
    const validated = bulkUpdatePriceSchema.parse(req.body);
    const results = await priceService.bulkUpdatePrices(validated.updates, req.user.id);
    res.status(200).json({ success: true, data: results });
});

const listPrices = asyncHandler(async (req, res) => {
    const prices = await priceService.listPricesWithProduct();
    res.status(200).json({ success: true, data: prices });
});

const getPriceHistory = asyncHandler(async (req, res) => {
    const variantId = parseInt(req.params.id, 10);
    if (isNaN(variantId)) {
      return res.status(400).json({ success: false, message: 'ID varian tidak valid' });
    }

    const history = await priceService.getPriceHistory(variantId);
    res.status(200).json({ success: true, data: history });
});

module.exports = {
  updatePrice,
  bulkUpdatePrices,
  listPrices,
  getPriceHistory,
};
