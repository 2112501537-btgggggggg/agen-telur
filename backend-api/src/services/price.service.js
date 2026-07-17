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
    include: {
      product: {
        include: {
          category: true,
        },
      },
    },
    orderBy: {
      product: {
        name: 'asc',
      },
    },
  });
}

async function getPriceHistory(variantId) {
  const variantExists = await prisma.productVariant.findUnique({
    where: { id: variantId },
  });

  if (!variantExists) {
    const err = new Error('Varian produk tidak ditemukan');
    err.status = 404;
    throw err;
  }

  return prisma.priceHistory.findMany({
    where: { productVariantId: variantId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { changedAt: 'desc' },
  });
}

module.exports = {
  updateVariantPrice,
  bulkUpdatePrices,
  listPricesWithProduct,
  getPriceHistory,
};
