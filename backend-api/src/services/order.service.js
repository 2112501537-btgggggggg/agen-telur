const prisma = require('../utils/prisma');
const { validateCheckout } = require('./checkout.service');
const { generateOrderNumber } = require('../utils/orderNumber.util');
const { snap } = require('../utils/midtrans.util');
const { STATUS_ORDER } = require('../constants/orderStatus');

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

async function listOrders(userId, filters = {}) {
  const where = { userId };

  if (filters.status) {
    where.status = filters.status;
  }

  const orders = await prisma.order.findMany({
    where,
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      paymentStatus: true,
      paymentType: true,
      totalAmount: true,
      createdAt: true,
    },
  });

  return orders.map(order => ({
    ...order,
    totalAmount: Number(order.totalAmount),
  }));
}

async function getOrderDetail(userId, orderId) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      address: true,
      items: {
        include: {
          variant: {
            include: {
              product: true,
            },
          },
        },
      },
    },
  });

  if (!order) {
    const err = new Error('Pesanan tidak ditemukan');
    err.status = 404;
    throw err;
  }

  if (order.userId !== userId) {
    const err = new Error('Anda tidak memiliki akses ke pesanan ini');
    err.status = 403;
    throw err;
  }

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    userId: order.userId,
    addressId: order.addressId,
    status: order.status,
    totalWeightKg: Number(order.totalWeightKg),
    subtotalAmount: Number(order.subtotalAmount),
    discountAmount: Number(order.discountAmount),
    totalAmount: Number(order.totalAmount),
    paymentStatus: order.paymentStatus,
    paymentType: order.paymentType,
    midtransOrderId: order.midtransOrderId,
    midtransTransactionId: order.midtransTransactionId,
    paymentChannel: order.paymentChannel,
    codConfirmedBy: order.codConfirmedBy,
    codConfirmedAt: order.codConfirmedAt,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    address: order.address,
    items: order.items.map(item => ({
      id: item.id,
      orderId: item.orderId,
      productVariantId: item.productVariantId,
      unit: item.unit,
      quantity: Number(item.quantity),
      weightKgEquivalent: Number(item.weightKgEquivalent),
      pricePerKg: Number(item.pricePerKg),
      subtotal: Number(item.subtotal),
      productName: item.variant.product.name,
      grade: item.variant.grade,
    })),
  };
}

async function listOrdersAdmin(filters = {}) {
  const where = {};

  if (filters.status) {
    where.status = filters.status;
  }
  if (filters.paymentStatus) {
    where.paymentStatus = filters.paymentStatus;
  }
  if (filters.from || filters.to) {
    where.createdAt = {};
    if (filters.from) {
      where.createdAt.gte = new Date(filters.from);
    }
    if (filters.to) {
      where.createdAt.lte = new Date(filters.to);
    }
  }

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      paymentStatus: true,
      paymentType: true,
      totalWeightKg: true,
      totalAmount: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },
      _count: {
        select: { items: true },
      },
    },
  });

  return orders.map(order => ({
    ...order,
    totalWeightKg: Number(order.totalWeightKg),
    totalAmount: Number(order.totalAmount),
    itemCount: order._count.items,
    _count: undefined,
  }));
}

async function getOrderDetailAdmin(orderId) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      address: true,
      items: {
        include: {
          variant: {
            include: {
              product: true,
            },
          },
        },
      },
    },
  });

  if (!order) {
    const err = new Error('Pesanan tidak ditemukan');
    err.status = 404;
    throw err;
  }

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    userId: order.userId,
    addressId: order.addressId,
    status: order.status,
    totalWeightKg: Number(order.totalWeightKg),
    subtotalAmount: Number(order.subtotalAmount),
    discountAmount: Number(order.discountAmount),
    totalAmount: Number(order.totalAmount),
    paymentStatus: order.paymentStatus,
    paymentType: order.paymentType,
    midtransOrderId: order.midtransOrderId,
    midtransTransactionId: order.midtransTransactionId,
    paymentChannel: order.paymentChannel,
    codConfirmedBy: order.codConfirmedBy,
    codConfirmedAt: order.codConfirmedAt,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    user: order.user,
    address: order.address,
    items: order.items.map(item => ({
      id: item.id,
      orderId: item.orderId,
      productVariantId: item.productVariantId,
      unit: item.unit,
      quantity: Number(item.quantity),
      weightKgEquivalent: Number(item.weightKgEquivalent),
      pricePerKg: Number(item.pricePerKg),
      subtotal: Number(item.subtotal),
      productName: item.variant.product.name,
      grade: item.variant.grade,
    })),
  };
}

async function updateOrderStatus(orderId, newStatus) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    const err = new Error('Pesanan tidak ditemukan');
    err.status = 404;
    throw err;
  }

  // Cek terminal state: CANCELLED atau DELIVERED tidak bisa diubah lagi
  if (order.status === 'CANCELLED' || order.status === 'DELIVERED') {
    const err = new Error(`Order sudah dalam status akhir (${order.status}), tidak bisa diubah lagi`);
    err.status = 400;
    throw err;
  }

  // Pastikan newStatus bukan CANCELLED (CANCELLED tidak ada di STATUS_ORDER)
  if (newStatus === 'CANCELLED') {
    const err = new Error('Gunakan endpoint cancel untuk membatalkan order');
    err.status = 400;
    throw err;
  }

  const currentIndex = STATUS_ORDER.indexOf(order.status);
  const newIndex = STATUS_ORDER.indexOf(newStatus);

  if (newIndex <= currentIndex) {
    const err = new Error('Tidak bisa mengubah status ke urutan yang sama atau mundur');
    err.status = 400;
    throw err;
  }

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: { status: newStatus },
  });

  return {
    id: updatedOrder.id,
    orderNumber: updatedOrder.orderNumber,
    status: updatedOrder.status,
  };
}

async function cancelOrder(orderId) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) {
    const err = new Error('Pesanan tidak ditemukan');
    err.status = 404;
    throw err;
  }

  // Validasi status: hanya PENDING, CONFIRMED, PROCESSING yang bisa dibatalkan
  const cancellableStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING'];
  if (!cancellableStatuses.includes(order.status)) {
    const err = new Error(`Order dengan status ${order.status} tidak bisa dibatalkan`);
    err.status = 400;
    throw err;
  }

  // Jalankan dalam transaction: update status + kembalikan stok
  const result = await prisma.$transaction(async (tx) => {
    // Update status jadi CANCELLED
    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: { status: 'CANCELLED' },
    });

    // Kembalikan stok untuk setiap item
    for (const item of order.items) {
      await tx.productVariant.update({
        where: { id: item.productVariantId },
        data: {
          stockKg: {
            increment: item.weightKgEquivalent,
          },
        },
      });
    }

    return {
      orderId: updatedOrder.id,
      status: updatedOrder.status,
    };
  });

  return {
    ...result,
    message: 'Order berhasil dibatalkan, stok telah dikembalikan',
  };
}

async function confirmCodPayment(orderId, adminUserId) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    const err = new Error('Pesanan tidak ditemukan');
    err.status = 404;
    throw err;
  }

  if (order.paymentType !== 'COD') {
    const err = new Error('Order ini menggunakan Midtrans, status pembayarannya otomatis lewat webhook, bukan konfirmasi manual');
    err.status = 400;
    throw err;
  }

  if (order.paymentStatus === 'PAID') {
    const err = new Error('Pembayaran order ini sudah dikonfirmasi sebelumnya');
    err.status = 400;
    throw err;
  }

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: {
      paymentStatus: 'PAID',
      codConfirmedBy: adminUserId,
      codConfirmedAt: new Date(),
    },
  });

  return {
    id: updatedOrder.id,
    orderNumber: updatedOrder.orderNumber,
    paymentStatus: updatedOrder.paymentStatus,
    codConfirmedBy: updatedOrder.codConfirmedBy,
    codConfirmedAt: updatedOrder.codConfirmedAt,
  };
}

module.exports = {
  createOrder,
  listOrders,
  getOrderDetail,
  listOrdersAdmin,
  getOrderDetailAdmin,
  updateOrderStatus,
  cancelOrder,
  confirmCodPayment,
};
