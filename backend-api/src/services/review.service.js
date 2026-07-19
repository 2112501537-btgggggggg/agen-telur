const prisma = require('../utils/prisma');

async function submitReview(userId, orderId, data) {
  // 1. Ambil Order
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    const err = new Error('Pesanan tidak ditemukan');
    err.status = 404;
    throw err;
  }

  // 2. Cek kepemilikan
  if (order.userId !== userId) {
    const err = new Error('Anda tidak memiliki akses ke pesanan ini');
    err.status = 403;
    throw err;
  }

  // 3. Cek status: hanya DELIVERED yang bisa direview
  if (order.status !== 'DELIVERED') {
    const err = new Error('Hanya pesanan yang sudah selesai yang bisa direview');
    err.status = 400;
    throw err;
  }

  // 4. Cek belum pernah review sebelumnya
  const existingReview = await prisma.review.findUnique({
    where: { orderId },
  });

  if (existingReview) {
    const err = new Error('Anda sudah pernah memberi review untuk pesanan ini');
    err.status = 400;
    throw err;
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
