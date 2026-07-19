const reviewService = require('../services/review.service');
const asyncHandler = require('../utils/asyncHandler');
const { reviewSchema } = require('../validators/review.validator');

const store = asyncHandler(async (req, res) => {
    const orderId = parseInt(req.params.id, 10);
    if (isNaN(orderId)) {
      return res.status(400).json({ success: false, message: 'ID Pesanan harus berupa angka' });
    }
    const validated = reviewSchema.parse(req.body);
    const result = await reviewService.submitReview(req.user.id, orderId, validated);
    res.status(201).json({ success: true, data: result });
});

const productReviews = asyncHandler(async (req, res) => {
    const productId = parseInt(req.params.id, 10);
    if (isNaN(productId)) {
      return res.status(400).json({ success: false, message: 'ID Produk harus berupa angka' });
    }
    const result = await reviewService.listReviewsForProduct(productId);
    res.status(200).json({ success: true, data: result });
});

module.exports = {
  store,
  productReviews,
};
