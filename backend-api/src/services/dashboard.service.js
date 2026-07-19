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

/**
 * Sales report: penjualan harian dalam rentang tanggal (hanya order PAID)
 */
async function getSalesReport(from, to) {
  const result = await prisma.$queryRaw`
    SELECT DATE(createdAt) as date, SUM(totalAmount) as totalSales
    FROM \`Order\`
    WHERE paymentStatus = 'PAID' AND createdAt >= ${from} AND createdAt <= ${to}
    GROUP BY DATE(createdAt)
    ORDER BY date ASC
  `;

  return result.map(row => ({
    date: row.date instanceof Date ? row.date.toISOString().split('T')[0] : row.date,
    totalSales: Number(row.totalSales),
  }));
}

/**
 * Damaged report: akumulasi damagedEggCount per produk dari Review
 */
async function getDamagedReport(limit = 10) {
  const reviews = await prisma.review.findMany({
    where: {
      damagedEggCount: { gt: 0 },
    },
    include: {
      order: {
        include: {
          items: {
            include: {
              variant: {
                include: {
                  product: {
                    select: { name: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  const productDamaged = new Map();

  for (const review of reviews) {
    const products = new Map();
    for (const item of review.order.items) {
      const productId = item.variant.productId;
      if (!products.has(productId)) {
        products.set(productId, item.variant.product.name);
      }
    }
    for (const [productId, productName] of products) {
      const current = productDamaged.get(productId) || { productId, productName, totalDamaged: 0 };
      current.totalDamaged += Number(review.damagedEggCount);
      productDamaged.set(productId, current);
    }
  }

  const sorted = Array.from(productDamaged.values())
    .sort((a, b) => b.totalDamaged - a.totalDamaged)
    .slice(0, limit);

  return sorted;
}

module.exports = {
  getSalesSummary,
  getOrdersByStatus,
  getLowStockVariants,
  getSalesReport,
  getDamagedReport,
};
