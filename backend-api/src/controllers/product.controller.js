const { productSchema, variantSchema } = require('../validators/product.validator');
const productService = require('../services/product.service');

function formatZodError(err) {
  return err.issues.map(e => ({ path: e.path.join('.'), message: e.message }));
}

async function createProduct(req, res, next) {
  try {
    const validated = productSchema.parse(req.body);
    const product = await productService.createProduct(validated, req.file);
    res.status(201).json({ success: true, data: product });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ success: false, errors: formatZodError(err) });
    }
    next(err);
  }
}

async function listProductsAdmin(req, res, next) {
  try {
    const products = await productService.listProductsAdmin(req.query);
    res.status(200).json({ success: true, data: products });
  } catch (err) {
    next(err);
  }
}

async function updateProduct(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'ID tidak valid' });
    }

    const validated = productSchema.partial().parse(req.body);
    const product = await productService.updateProduct(id, validated, req.file);
    res.status(200).json({ success: true, data: product });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ success: false, errors: formatZodError(err) });
    }
    next(err);
  }
}

async function softDeleteProduct(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'ID tidak valid' });
    }

    await productService.softDeleteProduct(id);
    res.status(200).json({ success: true, message: 'Produk berhasil dihapus' });
  } catch (err) {
    next(err);
  }
}

async function addVariant(req, res, next) {
  try {
    const productId = parseInt(req.params.id, 10);
    if (isNaN(productId)) {
      return res.status(400).json({ success: false, message: 'ID produk tidak valid' });
    }

    const validated = variantSchema.parse(req.body);
    const variant = await productService.addVariant(productId, validated);
    res.status(201).json({ success: true, data: variant });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ success: false, errors: formatZodError(err) });
    }
    next(err);
  }
}

async function updateVariant(req, res, next) {
  try {
    const variantId = parseInt(req.params.id, 10);
    if (isNaN(variantId)) {
      return res.status(400).json({ success: false, message: 'ID varian tidak valid' });
    }

    const validated = variantSchema.partial().parse(req.body);
    const variant = await productService.updateVariant(variantId, validated);
    res.status(200).json({ success: true, data: variant });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ success: false, errors: formatZodError(err) });
    }
    next(err);
  }
}

async function listProductsPublic(req, res, next) {
  try {
    const result = await productService.listProductsPublic(req.query);
    res.status(200).json({ success: true, data: result.products, meta: result.meta });
  } catch (err) {
    next(err);
  }
}

async function getProductPublicDetail(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'ID tidak valid' });
    }

    const product = await productService.getProductPublicDetail(id);
    res.status(200).json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
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
