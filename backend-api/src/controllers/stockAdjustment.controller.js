const { stockAdjustmentSchema } = require('../validators/stockAdjustment.validator');
const stockAdjustmentService = require('../services/stockAdjustment.service');
const asyncHandler = require('../utils/asyncHandler');

const adjust = asyncHandler(async (req, res) => {
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
});

const history = asyncHandler(async (req, res) => {
    const variantId = parseInt(req.params.id, 10);
    if (isNaN(variantId)) {
      return res.status(400).json({ success: false, message: 'ID varian tidak valid' });
    }

    const logs = await stockAdjustmentService.getAdjustmentHistory(variantId);
    res.status(200).json({ success: true, data: logs });
});

module.exports = {
  adjust,
  history,
};
