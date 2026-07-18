const prisma = require('../utils/prisma');
const { isAddressInServiceArea } = require('./serviceArea.service');
const { getConfig } = require('./membershipConfig.service');

async function validateCheckout(userId, addressId, items) {
  // 1. Optimize with parallel queries for address and user
  const [address, user] = await Promise.all([
    prisma.address.findUnique({
      where: { id: addressId },
      select: {
        id: true,
        userId: true,
        city: true,
        kecamatan: true,
      },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        isMember: true,
      },
    }),
  ]);

  if (!address || address.userId !== userId) {
    const err = new Error('Alamat tidak ditemukan atau bukan milik Anda');
    err.status = 404;
    throw err;
  }

  // 2. Cek area layanan
  const inServiceArea = await isAddressInServiceArea(address.city, address.kecamatan);
  if (!inServiceArea) {
    const districtText = address.kecamatan ? `${address.kecamatan}, ` : '';
    const err = new Error(`Maaf, kami belum melayani pengiriman ke ${districtText}${address.city}`);
    err.status = 400;
    throw err;
  }

  // 3. Parallel queries for conversions, variants, and config
  const variantIds = items.map(item => item.productVariantId);
  
  const [conversions, variants, config] = await Promise.all([
    prisma.unitConversion.findMany({
      select: {
        unit: true,
        kgEquivalent: true,
      },
    }),
    prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      select: {
        id: true,
        grade: true,
        pricePerKg: true,
        stockKg: true,
        product: {
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        },
      },
    }),
    getConfig(),
  ]);

  const conversionMap = {};
  conversions.forEach(c => {
    conversionMap[c.unit] = Number(c.kgEquivalent);
  });

  const variantMap = {};
  variants.forEach(v => {
    variantMap[v.id] = v;
  });

  // 4. Process items
  let totalWeightKg = 0;
  let subtotalAmount = 0;
  const itemsPreview = [];

  for (const item of items) {
    const variant = variantMap[item.productVariantId];
    if (!variant || !variant.product.isActive) {
      const err = new Error('Produk tidak ditemukan atau tidak aktif');
      err.status = 400;
      throw err;
    }

    const multiplier = conversionMap[item.unit] || 1;
    const weightKgEquivalent = item.quantity * multiplier;

    if (weightKgEquivalent > Number(variant.stockKg)) {
      const err = new Error(`Stok ${variant.product.name} (${variant.grade}) tidak cukup, sisa ${variant.stockKg}kg`);
      err.status = 400;
      throw err;
    }

    const itemSubtotal = weightKgEquivalent * Number(variant.pricePerKg);

    totalWeightKg += weightKgEquivalent;
    subtotalAmount += itemSubtotal;

    itemsPreview.push({
      productVariantId: item.productVariantId,
      productName: variant.product.name,
      grade: variant.grade,
      unit: item.unit,
      quantity: item.quantity,
      weightKgEquivalent,
      subtotal: itemSubtotal,
    });
  }

  // 5. Total berat & minimum order
  const minOrder = Number(config.minimumOrderKg);
  if (totalWeightKg < minOrder) {
    const needed = minOrder - totalWeightKg;
    const err = new Error(`Minimum order ${minOrder}kg, pesanan Anda baru ${totalWeightKg}kg. Tambah ${needed}kg lagi.`);
    err.status = 400;
    throw err;
  }

  // 6. Hitung diskon member
  const discountPercent = user.isMember ? Number(config.memberDiscountPercent) : 0;
  const discountAmount = subtotalAmount * (discountPercent / 100);
  const totalAmount = subtotalAmount - discountAmount;

  // 7. Return preview
  return {
    isValid: true,
    totalWeightKg,
    subtotalAmount,
    discountAmount,
    totalAmount,
    isMember: user.isMember,
    items: itemsPreview,
  };
}

module.exports = {
  validateCheckout,
};
