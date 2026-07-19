const prisma = require('../utils/prisma');
const AppError = require('../utils/AppError');
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
          throw new AppError(400, 'Varian produk tidak ditemukan');
        }

        if (Number(item.weightKgEquivalent) > Number(variant.stockKg)) {
          throw new AppError(400, `Stok ${variant.product.name} (${variant.grade}) tidak cukup, sisa ${variant.stockKg}kg`);
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
          throw new AppError(400, 'Varian produk tidak ditemukan');
        }

        if (Number(item.weightKgEquivalent) > Number(variant.stockKg)) {
          throw new AppError(400, `Stok ${variant.product.name} (${variant.grade}) tidak cukup, sisa ${variant.stockKg}kg`);
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

      throw new AppError(500, 'Gagal memproses pembayaran, silakan coba lagi.');
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
    throw new AppError(404, 'Pesanan tidak ditemukan');
  }

  if (order.userId !== userId) {
    throw new AppError(403, 'Anda tidak memiliki akses ke pesanan ini');
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
    throw new AppError(404, 'Pesanan tidak ditemukan');
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
    throw new AppError(404, 'Pesanan tidak ditemukan');
  }

  // Cek terminal state: CANCELLED atau DELIVERED tidak bisa diubah lagi
  if (order.status === 'CANCELLED' || order.status === 'DELIVERED') {
    throw new AppError(400, `Order sudah dalam status akhir (${order.status}), tidak bisa diubah lagi`);
  }

  // Pastikan newStatus bukan CANCELLED (CANCELLED tidak ada di STATUS_ORDER)
  if (newStatus === 'CANCELLED') {
    throw new AppError(400, 'Gunakan endpoint cancel untuk membatalkan order');
  }

  const currentIndex = STATUS_ORDER.indexOf(order.status);
  const newIndex = STATUS_ORDER.indexOf(newStatus);

  if (newIndex <= currentIndex) {
    throw new AppError(400, 'Tidak bisa mengubah status ke urutan yang sama atau mundur');
  }

  // Jika akan set DELIVERED, validasi paymentStatus dan sisipkan logika poin
  if (newStatus === 'DELIVERED') {
    if (order.paymentStatus !== 'PAID') {
      throw new AppError(400, 'Order belum dibayar. Untuk COD, konfirmasi pembayaran dulu lewat endpoint confirm-cod-payment sebelum menandai DELIVERED.');
    }

    const result = await prisma.$transaction(async (tx) => {
      // Update status order
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status: 'DELIVERED' },
      });

      // Ambil config membership
      const config = await tx.membershipConfig.findUnique({
        where: { id: 1 },
      });

      if (config) {
        // Hitung poin
        const pointsEarned = Math.floor(Number(order.totalAmount) * Number(config.pointsPerRupiah));

        if (pointsEarned > 0) {
          // Ambil data user
          const user = await tx.user.findUnique({
            where: { id: order.userId },
          });

          const newTotalPoints = user.totalPoints + pointsEarned;

          // Update user: tambah poin & upgrade member jika memenuhi threshold
          await tx.user.update({
            where: { id: order.userId },
            data: {
              totalPoints: newTotalPoints,
              isMember: !user.isMember && newTotalPoints >= Number(config.pointsThresholdForMember) ? true : user.isMember,
            },
          });
        }

        return {
          id: updatedOrder.id,
          orderNumber: updatedOrder.orderNumber,
          status: updatedOrder.status,
          pointsEarned,
        };
      }

      return {
        id: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        status: updatedOrder.status,
        pointsEarned: 0,
      };
    });

    // Ambil user terbaru untuk return points info
    const updatedUser = await prisma.user.findUnique({
      where: { id: order.userId },
      select: { totalPoints: true, isMember: true },
    });

    return {
      id: result.id,
      orderNumber: result.orderNumber,
      status: result.status,
      pointsEarned: result.pointsEarned,
      totalPoints: updatedUser.totalPoints,
      isMember: updatedUser.isMember,
    };
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
    throw new AppError(404, 'Pesanan tidak ditemukan');
  }

  // Validasi status: hanya PENDING, CONFIRMED, PROCESSING yang bisa dibatalkan
  const cancellableStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING'];
  if (!cancellableStatuses.includes(order.status)) {
    throw new AppError(400, `Order dengan status ${order.status} tidak bisa dibatalkan`);
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
    throw new AppError(404, 'Pesanan tidak ditemukan');
  }

  if (order.paymentType !== 'COD') {
    throw new AppError(400, 'Order ini menggunakan Midtrans, status pembayarannya otomatis lewat webhook, bukan konfirmasi manual');
  }

  if (order.paymentStatus === 'PAID') {
    throw new AppError(400, 'Pembayaran order ini sudah dikonfirmasi sebelumnya');
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
