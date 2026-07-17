const { stockAdjustmentSchema } = require('../validators/stockAdjustment.validator');
const stockAdjustmentService = require('../services/stockAdjustment.service');

function formatZodError(err) {
  return err.issues.map(e => ({ path: e.path.join('.'), message: e.message }));
}

async function adjust(req, res, next) {
  try {
    const variantId = parseInt(req.params.id, 10);
    if (isNaN(variantId)) {
      return res.status(400).json({ success: false, message: 'ID varian tidak valid' });
    }

    const validated = stockAdjustmentSchema.parse(req.body);
    const updated = await stockAdjustmentService.adjustStock(
      variantId,
      validated.changeKg,
      validated.reason,
      req.user.id
    );

    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ success: false, errors: formatZodError(err) });
    }
    next(err);
  }
}

async function history(req, res, next) {
  try {
    const variantId = parseInt(req.params.id, 10);
    if (isNaN(variantId)) {
      return res.status(400).json({ success: false, message: 'ID varian tidak valid' });
    }

    const logs = await stockAdjustmentService.getAdjustmentHistory(variantId);
    res.status(200).json({ success: true, data: logs });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  adjust,
  history,
};
