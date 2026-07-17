const prisma = require('../utils/prisma');

async function createStockIn(data, adminUserId) {
  const { supplierId, productVariantId, quantityKg, pricePerKg } = data;

  const supplier = await prisma.supplier.findUnique({
    where: { id: supplierId },
  });
  if (!supplier) {
    const err = new Error('Supplier tidak ditemukan');
    err.status = 400;
    throw err;
  }

  const variant = await prisma.productVariant.findUnique({
    where: { id: productVariantId },
  });
  if (!variant) {
    const err = new Error('Varian produk tidak ditemukan');
    err.status = 400;
    throw err;
  }

  const totalCost = quantityKg * pricePerKg;

  return prisma.$transaction(async (tx) => {
    // 1. Create StockIn record
    const stockIn = await tx.stockIn.create({
      data: {
        supplierId,
        productVariantId,
        quantityKg,
        pricePerKg,
        totalCost,
        createdBy: adminUserId,
      },
    });

    // 2. Increment variant stock
    await tx.productVariant.update({
      where: { id: productVariantId },
      data: {
        stockKg: {
          increment: quantityKg,
        },
      },
    });

    return stockIn;
  });
}

async function listStockIn(filters = {}) {
  const where = {};

  if (filters.productVariantId) {
    where.productVariantId = parseInt(filters.productVariantId, 10);
  }

  if (filters.supplierId) {
    where.supplierId = parseInt(filters.supplierId, 10);
  }

  if (filters.from || filters.to) {
    where.createdAt = {};
    if (filters.from) {
      where.createdAt.gte = new Date(`${filters.from}T00:00:00.000Z`);
    }
    if (filters.to) {
      where.createdAt.lte = new Date(`${filters.to}T23:59:59.999Z`);
    }
  }

  return prisma.stockIn.findMany({
    where,
    include: {
      supplier: true,
      variant: {
        include: {
          product: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

module.exports = {
  createStockIn,
  listStockIn,
};
