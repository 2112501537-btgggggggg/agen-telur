const prisma = require('../utils/prisma');

/**
 * Hitung total penjualan hari ini dan bulan ini (hanya order PAID)
 */
async function getSalesSummary() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);

  const paidFilter = { paymentStatus: 'PAID' };

  const [salesToday, salesThisMonth] = await Promise.all([
    prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: {
        ...paidFilter,
        createdAt: { gte: todayStart, lte: now },
      },
    }),
    prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: {
        ...paidFilter,
        createdAt: { gte: monthStart, lte: now },
      },
    }),
  ]);

  return {
    salesToday: Number(salesToday._sum.totalAmount || 0),
    salesThisMonth: Number(salesThisMonth._sum.totalAmount || 0),
  };
}

/**
 * Hitung jumlah order per status
 */
async function getOrdersByStatus() {
  const grouped = await prisma.order.groupBy({
    by: ['status'],
    _count: true,
  });

  const result = {};
  for (const item of grouped) {
    result[item.status] = item._count;
  }

  return result;
}

/**
 * Ambil varian produk dengan stok <= lowStockThreshold
 */
async function getLowStockVariants() {
  const variants = await prisma.productVariant.findMany({
    include: {
      product: {
        select: { name: true },
      },
    },
  });

  return variants
    .filter(v => Number(v.stockKg) <= Number(v.lowStockThreshold))
    .map(v => ({
      productVariantId: v.id,
      productName: v.product.name,
      grade: v.grade,
      stockKg: Number(v.stockKg),
      lowStockThreshold: Number(v.lowStockThreshold),
    }));
}

module.exports = {
  getSalesSummary,
  getOrdersByStatus,
  getLowStockVariants,
};
