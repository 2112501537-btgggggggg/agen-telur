const prisma = require('../utils/prisma');
const AppError = require('../utils/AppError');

async function submitReview(userId, orderId, data) {
  // 1. Ambil Order
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new AppError(404, 'Pesanan tidak ditemukan');
  }

  // 2. Cek kepemilikan
  if (order.userId !== userId) {
    throw new AppError(403, 'Anda tidak memiliki akses ke pesanan ini');
  }

  // 3. Cek status: hanya DELIVERED yang bisa direview
  if (order.status !== 'DELIVERED') {
    throw new AppError(400, 'Hanya pesanan yang sudah selesai yang bisa direview');
  }

  // 4. Cek belum pernah review sebelumnya
  const existingReview = await prisma.review.findUnique({
    where: { orderId },
  });

  if (existingReview) {
    throw new AppError(400, 'Anda sudah pernah memberi review untuk pesanan ini');
  }

  // 5. Buat Review baru
  const review = await prisma.review.create({
    data: {
      orderId,
      userId,
      rating: data.rating,
      comment: data.comment || null,
      damagedEggCount: data.damagedEggCount || null,
    },
  });

  return {
    id: review.id,
    orderId: review.orderId,
    rating: review.rating,
    comment: review.comment,
    damagedEggCount: review.damagedEggCount,
    createdAt: review.createdAt,
  };
}

async function listReviewsForProduct(productId) {
  // 1. Cari OrderItem yang mengandung produk varian dengan productId ini
  const orderItems = await prisma.orderItem.findMany({
    where: {
      variant: {
        productId: productId,
      },
    },
    select: {
      orderId: true,
    },
    distinct: ['orderId'],
  });

  const orderIds = orderItems.map(item => item.orderId);

  if (orderIds.length === 0) {
    return [];
  }

  // 2. Cari Review untuk order-order tersebut
  const reviews = await prisma.review.findMany({
    where: {
      orderId: {
        in: orderIds,
      },
    },
    include: {
      user: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return reviews.map(review => ({
    id: review.id,
    rating: review.rating,
    comment: review.comment,
    damagedEggCount: review.damagedEggCount,
    createdAt: review.createdAt,
    userName: review.user.name,
  }));
}

module.exports = {
  submitReview,
  listReviewsForProduct,
};
