const express = require('express');
const {
  createProduct,
  listProductsAdmin,
  updateProduct,
  softDeleteProduct,
  addVariant,
  updateVariant,
  listProductsPublic,
  getProductPublicDetail,
} = require('../controllers/product.controller');
const authMiddleware = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');
const upload = require('../middlewares/upload.middleware');

const publicRouter = express.Router();
const adminRouter = express.Router();

// Public routes
publicRouter.get('/', listProductsPublic);
publicRouter.get('/:id', getProductPublicDetail);

// Admin routes (all require Admin role)
adminRouter.use(authMiddleware);
adminRouter.use(requireRole(['ADMIN']));

adminRouter.post('/', upload.single('image'), createProduct);
adminRouter.put('/:id', upload.single('image'), updateProduct);
adminRouter.delete('/:id', softDeleteProduct);
adminRouter.get('/', listProductsAdmin);
adminRouter.post('/:id/variants', addVariant);
adminRouter.put('/variants/:id', updateVariant);

module.exports = {
  publicRouter,
  adminRouter,
};
