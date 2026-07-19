const { productSchema, variantSchema } = require('../validators/product.validator');
const productService = require('../services/product.service');
const asyncHandler = require('../utils/asyncHandler');

const createProduct = asyncHandler(async (req, res) => {
    const validated = productSchema.parse(req.body);
    const product = await productService.createProduct(validated, req.file);
    res.status(201).json({ success: true, data: product });
});

const listProductsAdmin = asyncHandler(async (req, res) => {
    const products = await productService.listProductsAdmin(req.query);
    res.status(200).json({ success: true, data: products });
});

const updateProduct = asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'ID tidak valid' });
    }

    const validated = productSchema.partial().parse(req.body);
    const product = await productService.updateProduct(id, validated, req.file);
    res.status(200).json({ success: true, data: product });
});

const softDeleteProduct = asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'ID tidak valid' });
    }

    await productService.softDeleteProduct(id);
    res.status(200).json({ success: true, message: 'Produk berhasil dihapus' });
});

const addVariant = asyncHandler(async (req, res) => {
    const productId = parseInt(req.params.id, 10);
    if (isNaN(productId)) {
      return res.status(400).json({ success: false, message: 'ID produk tidak valid' });
    }

    const validated = variantSchema.parse(req.body);
    const variant = await productService.addVariant(productId, validated);
    res.status(201).json({ success: true, data: variant });
});

const updateVariant = asyncHandler(async (req, res) => {
    const variantId = parseInt(req.params.id, 10);
    if (isNaN(variantId)) {
      return res.status(400).json({ success: false, message: 'ID varian tidak valid' });
    }

    const validated = variantSchema.partial().parse(req.body);
    const variant = await productService.updateVariant(variantId, validated);
    res.status(200).json({ success: true, data: variant });
});

const listProductsPublic = asyncHandler(async (req, res) => {
    const result = await productService.listProductsPublic(req.query);
    res.status(200).json({ success: true, data: result.products, meta: result.meta });
});

const getProductPublicDetail = asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'ID tidak valid' });
    }

    const product = await productService.getProductPublicDetail(id);
    res.status(200).json({ success: true, data: product });
});

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
