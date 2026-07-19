const dashboardService = require('../services/dashboard.service');

async function getDashboardSummary(req, res, next) {
  try {
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
  } catch (err) {
    next(err);
  }
}

async function salesReport(req, res, next) {
  try {
    const { from, to } = req.query;
    if (!from || !to) {
      return res.status(400).json({ success: false, message: 'Query parameter from dan to wajib diisi' });
    }
    const result = await dashboardService.getSalesReport(new Date(from), new Date(to));
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function damagedReport(req, res, next) {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;
    const result = await dashboardService.getDamagedReport(limit);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getDashboardSummary,
  salesReport,
  damagedReport,
};
