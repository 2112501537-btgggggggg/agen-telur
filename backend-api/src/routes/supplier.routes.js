const express = require('express');
const { index, store, update, destroy } = require('../controllers/supplier.controller');
const authMiddleware = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');

const router = express.Router();

router.use(authMiddleware);
router.use(requireRole(['ADMIN', 'STAFF']));

router.get('/', index);
router.post('/', store);
router.put('/:id', update);
router.delete('/:id', destroy);

module.exports = router;
