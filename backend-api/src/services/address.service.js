const prisma = require('../utils/prisma');

async function listAddresses(userId) {
  return prisma.address.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

async function createAddress(userId, data) {
  const existingCount = await prisma.address.count({
    where: { userId },
  });

  const isFirst = existingCount === 0;
  const shouldBeDefault = isFirst || data.isDefault === true;

  if (shouldBeDefault) {
    return prisma.$transaction(async (tx) => {
      // Unset all other default addresses for this user
      await tx.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });

      // Create new default address
      return tx.address.create({
        data: {
          ...data,
          userId,
          isDefault: true,
        },
      });
    });
  }

  return prisma.address.create({
    data: {
      ...data,
      userId,
      isDefault: false,
    },
  });
}

async function updateAddress(userId, addressId, data) {
  const address = await prisma.address.findUnique({
    where: { id: addressId },
  });

  if (!address) {
    const err = new Error('Alamat tidak ditemukan');
    err.status = 404;
    throw err;
  }

  if (address.userId !== userId) {
    const err = new Error('Akses ditolak');
    err.status = 403;
    throw err;
  }

  // If setting to default, transaction is needed
  if (data.isDefault === true) {
    return prisma.$transaction(async (tx) => {
      await tx.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });

      return tx.address.update({
        where: { id: addressId },
        data: {
          ...data,
          isDefault: true,
        },
      });
    });
  }

  return prisma.address.update({
    where: { id: addressId },
    data,
  });
}

async function deleteAddress(userId, addressId) {
  const address = await prisma.address.findUnique({
    where: { id: addressId },
  });

  if (!address) {
    const err = new Error('Alamat tidak ditemukan');
    err.status = 404;
    throw err;
  }

  if (address.userId !== userId) {
    const err = new Error('Akses ditolak');
    err.status = 403;
    throw err;
  }

  return prisma.address.delete({
    where: { id: addressId },
  });
}

module.exports = {
  listAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
};
