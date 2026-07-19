const express = require('express');
const { store, productReviews } = require('../controllers/review.controller');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/orders/:id/reviews', authMiddleware, store);
router.get('/products/:id/reviews', productReviews);

module.exports = router;
