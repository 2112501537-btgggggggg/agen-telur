const prisma = require('../utils/prisma');
const { validateCheckout } = require('./checkout.service');
const { generateOrderNumber } = require('../utils/orderNumber.util');

async function createOrder(userId, data) {
  // 1. Panggil validateCheckout untuk pengecekan validasi alamat, service area, minimum order, dan stok awal
  const checkoutResult = await validateCheckout(userId, data.addressId, data.items);

  // 2. Jika MIDTRANS, lempar 501
  if (data.paymentType === 'MIDTRANS') {
    const err = new Error('Metode pembayaran MIDTRANS belum diimplementasikan');
    err.status = 501;
    throw err;
  }

  // 3. Jalankan transaksi database
  const createdOrder = await prisma.$transaction(async (tx) => {
    // a. Cek ulang stok di dalam transaction untuk menghindari race condition
    const itemsWithUpdatedInfo = [];
    
    for (const item of checkoutResult.items) {
      const variant = await tx.productVariant.findUnique({
        where: { id: item.productVariantId },
        include: { product: true },
      });

      if (!variant) {
        const err = new Error('Varian produk tidak ditemukan');
        err.status = 400;
        throw err;
      }

      if (Number(item.weightKgEquivalent) > Number(variant.stockKg)) {
        const err = new Error(`Stok ${variant.product.name} (${variant.grade}) tidak cukup, sisa ${variant.stockKg}kg`);
        err.status = 400;
        throw err;
      }

      itemsWithUpdatedInfo.push({
        ...item,
        pricePerKg: Number(variant.pricePerKg),
      });
    }

    // b. Kurangi stok masing-masing varian
    for (const item of itemsWithUpdatedInfo) {
      await tx.productVariant.update({
        where: { id: item.productVariantId },
        data: {
          stockKg: {
            decrement: item.weightKgEquivalent,
          },
        },
      });
    }

    // c. Generate order number
    const orderNumber = await generateOrderNumber(tx);

    // d. Buat Order
    const order = await tx.order.create({
      data: {
        orderNumber,
        userId,
        addressId: data.addressId,
        status: 'PENDING',
        totalWeightKg: checkoutResult.totalWeightKg,
        subtotalAmount: checkoutResult.subtotalAmount,
        discountAmount: checkoutResult.discountAmount,
        totalAmount: checkoutResult.totalAmount,
        paymentStatus: 'UNPAID',
        paymentType: 'COD',
      },
    });

    // e. Buat OrderItem
    const orderItemData = itemsWithUpdatedInfo.map(item => ({
      orderId: order.id,
      productVariantId: item.productVariantId,
      unit: item.unit,
      quantity: item.quantity,
      weightKgEquivalent: item.weightKgEquivalent,
      pricePerKg: item.pricePerKg,
      subtotal: item.subtotal,
    }));

    await tx.orderItem.createMany({
      data: orderItemData,
    });

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      totalWeightKg: Number(order.totalWeightKg),
      subtotalAmount: Number(order.subtotalAmount),
      discountAmount: Number(order.discountAmount),
      totalAmount: Number(order.totalAmount),
      paymentType: order.paymentType,
      paymentStatus: order.paymentStatus,
    };
  });

  return createdOrder;
}

module.exports = {
  createOrder,
};
