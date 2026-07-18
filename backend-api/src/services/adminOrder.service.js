const prisma = require('../utils/prisma');

/**
 * List all orders for admin with filters and pagination
 * Optimized with indexes and field selection
 */
async function listAllOrders(filters = {}) {
  const where = {};

  // Filter by status
  if (filters.status) {
    where.status = filters.status;
  }

  // Filter by payment status
  if (filters.paymentStatus) {
    where.paymentStatus = filters.paymentStatus;
  }

  // Filter by payment type
  if (filters.paymentType) {
    where.paymentType = filters.paymentType;
  }

  // Filter by user ID
  if (filters.userId) {
    where.userId = parseInt(filters.userId, 10);
  }

  // Filter by date range
  if (filters.from || filters.to) {
    where.createdAt = {};
    if (filters.from) {
      where.createdAt.gte = new Date(`${filters.from}T00:00:00.000Z`);
    }
    if (filters.to) {
      where.createdAt.lte = new Date(`${filters.to}T23:59:59.999Z`);
    }
  }

  // Pagination
  const limit = parseInt(filters.limit, 10) || 20;
  const page = parseInt(filters.page, 10) || 1;
  const skip = (page - 1) * limit;

  const [orders, total] = await prisma.$transaction([
    prisma.order.findMany({
      where,
      select: {
        id: true,
        orderNumber: true,
        userId: true,
        status: true,
        paymentStatus: true,
        paymentType: true,
        totalAmount: true,
        totalWeightKg: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        address: {
          select: {
            city: true,
            kecamatan: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  return {
    orders: orders.map(order => ({
      ...order,
      totalAmount: Number(order.totalAmount),
      totalWeightKg: Number(order.totalWeightKg),
    })),
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get order detail for admin (full details)
 */
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
          isMember: true,
        },
      },
      address: true,
      items: {
        include: {
          variant: {
            select: {
              id: true,
              grade: true,
              product: {
                select: {
                  id: true,
                  name: true,
                  imageUrl: true,
                },
              },
            },
          },
        },
      },
      codConfirmer: {
        select: {
          id: true,
          name: true,
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
    codConfirmer: order.codConfirmer,
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
      productImage: item.variant.product.imageUrl,
      grade: item.variant.grade,
    })),
  };
}

/**
 * Update order status
 */
async function updateOrderStatus(orderId, status, adminUserId) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, status: true },
  });

  if (!order) {
    const err = new Error('Pesanan tidak ditemukan');
    err.status = 404;
    throw err;
  }

  const validStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
  if (!validStatuses.includes(status)) {
    const err = new Error('Status tidak valid');
    err.status = 400;
    throw err;
  }

  return prisma.order.update({
    where: { id: orderId },
    data: { status },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      updatedAt: true,
    },
  });
}

/**
 * Confirm COD payment (manually mark as paid)
 */
async function confirmCodPayment(orderId, adminUserId) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      paymentType: true,
      paymentStatus: true,
    },
  });

  if (!order) {
    const err = new Error('Pesanan tidak ditemukan');
    err.status = 404;
    throw err;
  }

  if (order.paymentType !== 'COD') {
    const err = new Error('Hanya pesanan COD yang bisa dikonfirmasi manual');
    err.status = 400;
    throw err;
  }

  if (order.paymentStatus === 'PAID') {
    const err = new Error('Pesanan sudah ditandai sebagai PAID');
    err.status = 400;
    throw err;
  }

  return prisma.order.update({
    where: { id: orderId },
    data: {
      paymentStatus: 'PAID',
      codConfirmedBy: adminUserId,
      codConfirmedAt: new Date(),
    },
    select: {
      id: true,
      orderNumber: true,
      paymentStatus: true,
      codConfirmedBy: true,
      codConfirmedAt: true,
    },
  });
}

/**
 * Get dashboard statistics for admin
 * Optimized with indexes
 */
async function getDashboardStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalOrders,
    todayOrders,
    pendingOrders,
    lowStockProducts,
    totalRevenue,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({
      where: {
        createdAt: {
          gte: today,
        },
      },
    }),
    prisma.order.count({
      where: {
        status: {
          in: ['PENDING', 'CONFIRMED'],
        },
      },
    }),
    prisma.productVariant.findMany({
      where: {
        stockKg: {
          lte: prisma.productVariant.fields.lowStockThreshold,
        },
        product: {
          isActive: true,
        },
      },
      select: {
        id: true,
        grade: true,
        stockKg: true,
        lowStockThreshold: true,
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      take: 10,
    }),
    prisma.order.aggregate({
      where: {
        paymentStatus: 'PAID',
      },
      _sum: {
        totalAmount: true,
      },
    }),
  ]);

  return {
    totalOrders,
    todayOrders,
    pendingOrders,
    lowStockProducts: lowStockProducts.map(v => ({
      ...v,
      stockKg: Number(v.stockKg),
      lowStockThreshold: Number(v.lowStockThreshold),
    })),
    totalRevenue: Number(totalRevenue._sum.totalAmount || 0),
  };
}

module.exports = {
  listAllOrders,
  getOrderDetailAdmin,
  updateOrderStatus,
  confirmCodPayment,
  getDashboardStats,
};
