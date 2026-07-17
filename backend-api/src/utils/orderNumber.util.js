const prisma = require('./prisma');

async function generateOrderNumber(tx = prisma) {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;

  // Tentukan awal dan akhir hari ini
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const count = await tx.order.count({
    where: {
      createdAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
  });

  const nextNum = String(count + 1).padStart(4, '0');
  return `ORD-${dateStr}-${nextNum}`;
}

module.exports = {
  generateOrderNumber,
};
