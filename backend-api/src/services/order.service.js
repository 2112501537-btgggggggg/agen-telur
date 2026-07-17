const prisma = require('../utils/prisma');
const { validateCheckout } = require('./checkout.service');
const { generateOrderNumber } = require('../utils/orderNumber.util');
const { snap } = require('../utils/midtrans.util');

async function createOrder(userId, data) {
  // 1. Panggil validateCheckout untuk pengecekan validasi alamat, service area, minimum order, dan stok awal
  const checkoutResult = await validateCheckout(userId, data.addressId, data.items);

  // Jalankan transaksi database
  if (data.paymentType === 'COD') {
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
  } else {
    // 2. MIDTRANS Flow
    // Langkah A: Buat order di database terlebih dahulu & commit transaction
    const dbOrder = await prisma.$transaction(async (tx) => {
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

      // Kurangi stok
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

      const orderNumber = await generateOrderNumber(tx);

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
          paymentType: 'MIDTRANS',
        },
      });

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

    // Ambil data user untuk payload Midtrans
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    // Langkah B: Panggil Midtrans Snap API di luar transaction
    let transaction;
    try {
      transaction = await snap.createTransaction({
        transaction_details: {
          order_id: dbOrder.orderNumber,
          gross_amount: Math.round(dbOrder.totalAmount),
        },
        customer_details: {
          first_name: user.name,
          email: user.email,
          phone: user.phone,
        },
      });
    } catch (snapError) {
      console.error('Midtrans Snap Error:', snapError);
      if (snapError.ApiResponse && snapError.ApiResponse.data) {
        console.error('Midtrans API Response Data:', JSON.stringify(snapError.ApiResponse.data, null, 2));
      }
      // Langkah D: Compensating action jika gagal memanggil API Midtrans
      await prisma.$transaction(async (tx) => {
        // Kembalikan stok
        for (const item of checkoutResult.items) {
          await tx.productVariant.update({
            where: { id: item.productVariantId },
            data: {
              stockKg: {
                increment: item.weightKgEquivalent,
              },
            },
          });
        }
        // Hapus OrderItem
        await tx.orderItem.deleteMany({
          where: { orderId: dbOrder.orderId },
        });
        // Hapus Order
        await tx.order.delete({
          where: { id: dbOrder.orderId },
        });
      });

      const err = new Error('Gagal memproses pembayaran, silakan coba lagi.');
      err.status = 500;
      throw err;
    }

    // Langkah C: Jika sukses, update order setting midtransOrderId
    await prisma.order.update({
      where: { id: dbOrder.orderId },
      data: { midtransOrderId: dbOrder.orderNumber },
    });

    return {
      ...dbOrder,
      midtransOrderId: dbOrder.orderNumber,
      midtransSnapToken: transaction.token,
    };
  }
}

module.exports = {
  createOrder,
};
