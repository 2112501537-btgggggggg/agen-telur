const prisma = require('../utils/prisma');

async function listSuppliers() {
  return prisma.supplier.findMany({
    orderBy: { name: 'asc' },
  });
}

async function createSupplier({ name, contact, address }) {
  return prisma.supplier.create({
    data: { name, contact, address },
  });
}

async function updateSupplier(id, { name, contact, address }) {
  const existing = await prisma.supplier.findUnique({
    where: { id },
  });

  if (!existing) {
    const err = new Error('Supplier tidak ditemukan');
    err.status = 404;
    throw err;
  }

  return prisma.supplier.update({
    where: { id },
    data: { name, contact, address },
  });
}

async function deleteSupplier(id) {
  const existing = await prisma.supplier.findUnique({
    where: { id },
  });

  if (!existing) {
    const err = new Error('Supplier tidak ditemukan');
    err.status = 404;
    throw err;
  }

  return prisma.supplier.delete({
    where: { id },
  });
}

module.exports = {
  listSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
};
