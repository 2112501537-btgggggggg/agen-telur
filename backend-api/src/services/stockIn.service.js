const prisma = require('../utils/prisma');
const AppError = require('../utils/AppError');

async function createStockIn(data, adminUserId) {
  const { supplierId, productVariantId, quantityKg, pricePerKg } = data;

  const supplier = await prisma.supplier.findUnique({
    where: { id: supplierId },
  });
  if (!supplier) {
    throw new AppError(400, 'Supplier tidak ditemukan');
  }

  const variant = await prisma.productVariant.findUnique({
    where: { id: productVariantId },
  });
  if (!variant) {
    throw new AppError(400, 'Varian produk tidak ditemukan');
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
