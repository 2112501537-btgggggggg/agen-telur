const asyncHandler = require('../utils/asyncHandler');
const dashboardService = require('../services/dashboard.service');

const getDashboardSummary = asyncHandler(async (req, res) => {
  const [salesSummary, ordersByStatus, lowStockVariants] = await Promise.all([
    dashboardService.getSalesSummary(),
    dashboardService.getOrdersByStatus(),
    dashboardService.getLowStockVariants(),
  ]);
  res.json({
    success: true,
    data: {
      ...salesSummary,
      ordersByStatus,
      lowStockVariants,
    },
  });
});

const salesReport = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  if (!from || !to) {
    return res.status(400).json({ success: false, message: 'Query parameter from dan to wajib diisi' });
  }
  const result = await dashboardService.getSalesReport(new Date(from), new Date(to));
  res.json({ success: true, data: result });
});

const damagedReport = asyncHandler(async (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;
  const result = await dashboardService.getDamagedReport(limit);
  res.json({ success: true, data: result });
});

module.exports = { getDashboardSummary, salesReport, damagedReport };
