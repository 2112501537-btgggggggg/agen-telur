const express = require('express');
const { index, store } = require('../controllers/stockIn.controller');
const authMiddleware = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');

const router = express.Router();

router.use(authMiddleware);
router.use(requireRole(['ADMIN', 'STAFF']));

router.get('/', index);
router.post('/', store);

module.exports = router;
