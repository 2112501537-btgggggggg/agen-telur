const asyncHandler = require('../utils/asyncHandler');
const stockInService = require('../services/stockIn.service');

const store = asyncHandler(async (req, res) => {
  const stockIn = await stockInService.createStockIn(req.body, req.user.id);
  res.status(201).json({ success: true, data: stockIn });
});

const index = asyncHandler(async (req, res) => {
  const history = await stockInService.listStockIn(req.query);
  res.json({ success: true, data: history });
});

module.exports = { store, index };
