const { updatePriceSchema, bulkUpdatePriceSchema } = require('../validators/price.validator');
const priceService = require('../services/price.service');

function formatZodError(err) {
  return err.issues.map(e => ({ path: e.path.join('.'), message: e.message }));
}

async function updatePrice(req, res, next) {
  try {
    const variantId = parseInt(req.params.id, 10);
    if (isNaN(variantId)) {
      return res.status(400).json({ success: false, message: 'ID varian tidak valid' });
    }

    const validated = updatePriceSchema.parse(req.body);
    const updated = await priceService.updateVariantPrice(variantId, validated.newPrice, req.user.id);
    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ success: false, errors: formatZodError(err) });
    }
    next(err);
  }
}

async function bulkUpdatePrices(req, res, next) {
  try {
    const validated = bulkUpdatePriceSchema.parse(req.body);
    const results = await priceService.bulkUpdatePrices(validated.updates, req.user.id);
    res.status(200).json({ success: true, data: results });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ success: false, errors: formatZodError(err) });
    }
    next(err);
  }
}

async function listPrices(req, res, next) {
  try {
    const prices = await priceService.listPricesWithProduct();
    res.status(200).json({ success: true, data: prices });
  } catch (err) {
    next(err);
  }
}

async function getPriceHistory(req, res, next) {
  try {
    const variantId = parseInt(req.params.id, 10);
    if (isNaN(variantId)) {
      return res.status(400).json({ success: false, message: 'ID varian tidak valid' });
    }

    const history = await priceService.getPriceHistory(variantId);
    res.status(200).json({ success: true, data: history });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  updatePrice,
  bulkUpdatePrices,
  listPrices,
  getPriceHistory,
};
