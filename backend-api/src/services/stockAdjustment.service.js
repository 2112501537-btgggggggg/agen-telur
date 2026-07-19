const prisma = require('../utils/prisma');
const AppError = require('../utils/AppError');

async function adjustStock(variantId, changeKg, reason, adminUserId) {
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
  });

  if (!variant) {
    throw new AppError(404, 'Varian produk tidak ditemukan');
  }

  // Parse decimals to numbers to avoid float inaccuracies during logic checks
  const currentStock = Number(variant.stockKg);
  const newStock = currentStock + changeKg;

  if (newStock < 0) {
    throw new AppError(400, `Stok tidak cukup, sisa stok saat ini hanya ${currentStock} kg`);
  }

  return prisma.$transaction(async (tx) => {
    // 1. Update ProductVariant stock
    const updatedVariant = await tx.productVariant.update({
      where: { id: variantId },
      data: {
        stockKg: newStock,
      },
    });

    // 2. Create StockAdjustment log
    await tx.stockAdjustment.create({
      data: {
        productVariantId: variantId,
        changeKg,
        reason,
        adjustedBy: adminUserId,
      },
    });

    return updatedVariant;
  });
}

async function getAdjustmentHistory(variantId) {
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
  });

  if (!variant) {
    throw new AppError(404, 'Varian produk tidak ditemukan');
  }

  return prisma.stockAdjustment.findMany({
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
    orderBy: { createdAt: 'desc' },
  });
}

module.exports = {
  adjustStock,
  getAdjustmentHistory,
};
