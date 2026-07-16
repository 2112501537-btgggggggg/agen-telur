const prisma = require('../utils/prisma');

async function createProduct({ name, categoryId, description }, imageFile) {
  // Validate category existence
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });
  if (!category) {
    const err = new Error('Kategori tidak ditemukan');
    err.status = 400;
    throw err;
  }

  const imageUrl = imageFile ? `/uploads/${imageFile.filename}` : null;

  return prisma.product.create({
    data: {
      name,
      categoryId,
      description,
      imageUrl,
    },
    include: {
      category: true,
    },
  });
}

async function listProductsAdmin(filters = {}) {
  const where = {};
  if (filters.categoryId) {
    where.categoryId = parseInt(filters.categoryId, 10);
  }

  return prisma.product.findMany({
    where,
    include: {
      category: true,
      variants: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

async function updateProduct(id, { name, categoryId, description }, imageFile) {
  const product = await prisma.product.findUnique({
    where: { id },
  });
  if (!product) {
    const err = new Error('Produk tidak ditemukan');
    err.status = 404;
    throw err;
  }

  if (categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!category) {
      const err = new Error('Kategori tidak ditemukan');
      err.status = 400;
      throw err;
    }
  }

  const updateData = { name, categoryId, description };
  if (imageFile) {
    updateData.imageUrl = `/uploads/${imageFile.filename}`;
  }

  return prisma.product.update({
    where: { id },
    data: updateData,
    include: {
      category: true,
      variants: true,
    },
  });
}

async function softDeleteProduct(id) {
  const product = await prisma.product.findUnique({
    where: { id },
  });
  if (!product) {
    const err = new Error('Produk tidak ditemukan');
    err.status = 404;
    throw err;
  }

  return prisma.product.update({
    where: { id },
    data: { isActive: false },
  });
}

async function addVariant(productId, { grade, pricePerKg, stockKg, lowStockThreshold }) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });
  if (!product) {
    const err = new Error('Produk tidak ditemukan');
    err.status = 404;
    throw err;
  }

  try {
    return await prisma.productVariant.create({
      data: {
        productId,
        grade,
        pricePerKg,
        stockKg,
        lowStockThreshold,
      },
    });
  } catch (err) {
    // Catch P2002 duplicate unique constraint
    if (err.code === 'P2002') {
      const error = new Error('Varian grade ini sudah ada untuk produk ini');
      error.status = 409;
      throw error;
    }
    throw err;
  }
}

async function updateVariant(variantId, data) {
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
  });
  if (!variant) {
    const err = new Error('Varian tidak ditemukan');
    err.status = 404;
    throw err;
  }

  // Ensure pricePerKg is NOT modified
  if (data.pricePerKg !== undefined && Number(data.pricePerKg) !== Number(variant.pricePerKg)) {
    const err = new Error('Harga tidak boleh diubah melalui endpoint ini');
    err.status = 400;
    throw err;
  }

  // Strip pricePerKg from update payload to avoid any accidental updates
  const { pricePerKg, ...updateData } = data;

  return prisma.productVariant.update({
    where: { id: variantId },
    data: updateData,
  });
}

async function listProductsPublic(filters = {}) {
  const where = { isActive: true };

  if (filters.categoryId) {
    where.categoryId = parseInt(filters.categoryId, 10);
  }

  if (filters.search) {
    where.name = {
      contains: filters.search,
    };
  }

  const limit = parseInt(filters.limit, 10) || 10;
  const page = parseInt(filters.page, 10) || 1;
  const skip = (page - 1) * limit;

  const [products, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      include: {
        category: true,
        variants: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

async function getProductPublicDetail(id) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      variants: true,
    },
  });

  if (!product || !product.isActive) {
    const err = new Error('Produk tidak ditemukan');
    err.status = 404;
    throw err;
  }

  return product;
}

module.exports = {
  createProduct,
  listProductsAdmin,
  updateProduct,
  softDeleteProduct,
  addVariant,
  updateVariant,
  listProductsPublic,
  getProductPublicDetail,
};
