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

module.exports = {
  getDashboardSummary,
};
