const prisma = require('../utils/prisma');
const AppError = require('../utils/AppError');

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
    throw new AppError(409, 'Nama kategori sudah terdaftar');
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
    throw new AppError(409, 'Nama kategori sudah terdaftar');
  }

  const category = await prisma.category.findUnique({
    where: { id },
  });
  if (!category) {
    throw new AppError(404, 'Kategori tidak ditemukan');
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
    throw new AppError(404, 'Kategori tidak ditemukan');
  }

  // Check if any product uses this category
  const productCount = await prisma.product.count({
    where: { categoryId: id },
  });
  if (productCount > 0) {
    throw new AppError(400, 'Kategori masih memiliki produk, tidak bisa dihapus');
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
