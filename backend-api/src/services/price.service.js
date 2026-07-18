const prisma = require('../utils/prisma');

async function updateVariantPrice(variantId, newPrice, adminUserId) {
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
  });

  if (!variant) {
    const err = new Error('Varian produk tidak ditemukan');
    err.status = 404;
    throw err;
  }

  return prisma.$transaction(async (tx) => {
    // Record price history
    await tx.priceHistory.create({
      data: {
        productVariantId: variantId,
        oldPrice: variant.pricePerKg,
        newPrice: newPrice,
        changedBy: adminUserId,
      },
    });

    // Update variant price and timestamp
    return tx.productVariant.update({
      where: { id: variantId },
      data: {
        pricePerKg: newPrice,
        lastPriceUpdateAt: new Date(),
      },
    });
  });
}

async function bulkUpdatePrices(updates, adminUserId) {
  return prisma.$transaction(async (tx) => {
    const results = [];

    for (const update of updates) {
      const { productVariantId, newPrice } = update;

      const variant = await tx.productVariant.findUnique({
        where: { id: productVariantId },
      });

      if (!variant) {
        const err = new Error(`Varian produk dengan ID ${productVariantId} tidak ditemukan`);
        err.status = 404;
        throw err;
      }

      await tx.priceHistory.create({
        data: {
          productVariantId,
          oldPrice: variant.pricePerKg,
          newPrice,
          changedBy: adminUserId,
        },
      });

      const updated = await tx.productVariant.update({
        where: { id: productVariantId },
        data: {
          pricePerKg: newPrice,
          lastPriceUpdateAt: new Date(),
        },
      });

      results.push(updated);
    }

    return results;
  });
}

async function listPricesWithProduct() {
  return prisma.productVariant.findMany({
    select: {
      id: true,
      productId: true,
      grade: true,
      pricePerKg: true,
      stockKg: true,
      lastPriceUpdateAt: true,
      product: {
        select: {
          id: true,
          name: true,
          imageUrl: true,
          isActive: true,
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    where: {
      product: {
        isActive: true,
      },
    },
    orderBy: {
      product: {
        name: 'asc',
      },
    },
  });
}

async function getPriceHistory(variantId, filters = {}) {
  const variantExists = await prisma.productVariant.findUnique({
    where: { id: variantId },
    select: { id: true },
  });

  if (!variantExists) {
    const err = new Error('Varian produk tidak ditemukan');
    err.status = 404;
    throw err;
  }

  // Add pagination support for price history
  const limit = parseInt(filters.limit, 10) || 50;
  const page = parseInt(filters.page, 10) || 1;
  const skip = (page - 1) * limit;

  const [history, total] = await prisma.$transaction([
    prisma.priceHistory.findMany({
      where: { productVariantId: variantId },
      select: {
        id: true,
        oldPrice: true,
        newPrice: true,
        changedAt: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { changedAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.priceHistory.count({ where: { productVariantId: variantId } }),
  ]);

  return {
    history,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

module.exports = {
  updateVariantPrice,
  bulkUpdatePrices,
  listPricesWithProduct,
  getPriceHistory,
};
