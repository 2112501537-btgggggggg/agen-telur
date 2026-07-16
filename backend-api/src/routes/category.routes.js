const express = require('express');
const { index, store, update, destroy } = require('../controllers/category.controller');
const authMiddleware = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');

const publicRouter = express.Router();
publicRouter.get('/', index);

const adminRouter = express.Router();
adminRouter.post('/', authMiddleware, requireRole(['ADMIN']), store);
adminRouter.put('/:id', authMiddleware, requireRole(['ADMIN']), update);
adminRouter.delete('/:id', authMiddleware, requireRole(['ADMIN']), destroy);

module.exports = { publicRouter, adminRouter };
