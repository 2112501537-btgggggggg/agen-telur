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
const { adjust, history } = require('../controllers/stockAdjustment.controller');
const authMiddleware = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');
const upload = require('../middlewares/upload.middleware');

const publicRouter = express.Router();
const adminRouter = express.Router();

// Public routes
publicRouter.get('/', listProductsPublic);
publicRouter.get('/:id', getProductPublicDetail);

// Admin routes (all require authMiddleware)
adminRouter.use(authMiddleware);

// Stock adjustment routes (Admin & Staff)
adminRouter.post('/variants/:id/stock-adjustment', requireRole(['ADMIN', 'STAFF']), adjust);
adminRouter.get('/variants/:id/stock-adjustments', requireRole(['ADMIN', 'STAFF']), history);

// Product CRUD and variants setup routes (Admin only)
adminRouter.post('/', requireRole(['ADMIN']), upload.single('image'), createProduct);
adminRouter.put('/:id', requireRole(['ADMIN']), upload.single('image'), updateProduct);
adminRouter.delete('/:id', requireRole(['ADMIN']), softDeleteProduct);
adminRouter.get('/', requireRole(['ADMIN']), listProductsAdmin);
adminRouter.post('/:id/variants', requireRole(['ADMIN']), addVariant);
adminRouter.put('/variants/:id', requireRole(['ADMIN']), updateVariant);

module.exports = {
  publicRouter,
  adminRouter,
};
