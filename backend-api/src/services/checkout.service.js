const prisma = require('../utils/prisma');
const AppError = require('../utils/AppError');
const { isAddressInServiceArea } = require('./serviceArea.service');
const { getConfig } = require('./membershipConfig.service');

async function validateCheckout(userId, addressId, items) {
  // 1. Cek kepemilikan alamat
  const address = await prisma.address.findUnique({
    where: { id: addressId },
  });

  if (!address || address.userId !== userId) {
    throw new AppError(404, 'Alamat tidak ditemukan atau bukan milik Anda');
  }

  // 2. Cek area layanan
  const inServiceArea = await isAddressInServiceArea(address.city, address.kecamatan);
  if (!inServiceArea) {
    const districtText = address.kecamatan ? `${address.kecamatan}, ` : '';
    throw new AppError(400, `Maaf, kami belum melayani pengiriman ke ${districtText}${address.city}`);
  }

  // 3. Ambil UnitConversion
  const conversions = await prisma.unitConversion.findMany();
  const conversionMap = {};
  conversions.forEach(c => {
    conversionMap[c.unit] = Number(c.kgEquivalent);
  });

  // 4. Proses tiap item
  const variantIds = items.map(item => item.productVariantId);
  const variants = await prisma.productVariant.findMany({
    where: { id: { in: variantIds } },
    include: { product: true },
  });

  const variantMap = {};
  variants.forEach(v => {
    variantMap[v.id] = v;
  });

  let totalWeightKg = 0;
  let subtotalAmount = 0;
  const itemsPreview = [];

  for (const item of items) {
    const variant = variantMap[item.productVariantId];
    if (!variant || !variant.product.isActive) {
      throw new AppError(400, 'Produk tidak ditemukan atau tidak aktif');
    }

    const multiplier = conversionMap[item.unit] || 1;
    const weightKgEquivalent = item.quantity * multiplier;

    if (weightKgEquivalent > Number(variant.stockKg)) {
      throw new AppError(400, `Stok ${variant.product.name} (${variant.grade}) tidak cukup, sisa ${variant.stockKg}kg`);
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
  const config = await getConfig();
  const minOrder = Number(config.minimumOrderKg);
  if (totalWeightKg < minOrder) {
    const needed = minOrder - totalWeightKg;
    throw new AppError(400, `Minimum order ${minOrder}kg, pesanan Anda baru ${totalWeightKg}kg. Tambah ${needed}kg lagi.`);
  }

  // 6. Hitung diskon member
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

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
