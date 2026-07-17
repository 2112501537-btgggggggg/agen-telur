const express = require('express');
const { indexActive, indexAll, store, update, destroy } = require('../controllers/serviceArea.controller');
const authMiddleware = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');

const publicRouter = express.Router();
const adminRouter = express.Router();

// Public routes
publicRouter.get('/', indexActive);

// Admin routes (require Admin role)
adminRouter.use(authMiddleware);
adminRouter.use(requireRole(['ADMIN']));

adminRouter.get('/', indexAll);
adminRouter.post('/', store);
adminRouter.put('/:id', update);
adminRouter.delete('/:id', destroy);

module.exports = {
  publicRouter,
  adminRouter,
};
