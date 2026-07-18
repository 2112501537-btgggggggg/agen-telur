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

  // Add pagination support
  const limit = parseInt(filters.limit, 10) || 20;
  const page = parseInt(filters.page, 10) || 1;
  const skip = (page - 1) * limit;

  const [stockIns, total] = await prisma.$transaction([
    prisma.stockIn.findMany({
      where,
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            contact: true,
          },
        },
        variant: {
          select: {
            id: true,
            grade: true,
            product: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.stockIn.count({ where }),
  ]);

  return {
    stockIns,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

module.exports = {
  createStockIn,
  listStockIn,
};
