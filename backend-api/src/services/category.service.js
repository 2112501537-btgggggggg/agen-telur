const prisma = require('../utils/prisma');

async function listCategories() {
  return prisma.category.findMany({
    orderBy: { id: 'asc' },
  });
}

async function createCategory({ name }) {
  const existing = await prisma.category.findUnique({
    where: { name },
  });
  if (existing) {
    const err = new Error('Nama kategori sudah terdaftar');
    err.status = 409;
    throw err;
  }

  return prisma.category.create({
    data: { name },
  });
}

async function updateCategory(id, { name }) {
  const existing = await prisma.category.findUnique({
    where: { name },
  });
  if (existing && existing.id !== id) {
    const err = new Error('Nama kategori sudah terdaftar');
    err.status = 409;
    throw err;
  }

  const category = await prisma.category.findUnique({
    where: { id },
  });
  if (!category) {
    const err = new Error('Kategori tidak ditemukan');
    err.status = 404;
    throw err;
  }

  return prisma.category.update({
    where: { id },
    data: { name },
  });
}

async function deleteCategory(id) {
  const category = await prisma.category.findUnique({
    where: { id },
  });
  if (!category) {
    const err = new Error('Kategori tidak ditemukan');
    err.status = 404;
    throw err;
  }

  // Check if any product uses this category
  const productCount = await prisma.product.count({
    where: { categoryId: id },
  });
  if (productCount > 0) {
    const err = new Error('Kategori masih memiliki produk, tidak bisa dihapus');
    err.status = 400;
    throw err;
  }

  return prisma.category.delete({
    where: { id },
  });
}

module.exports = {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
