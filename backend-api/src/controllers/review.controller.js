const reviewService = require('../services/review.service');
const { reviewSchema } = require('../validators/review.validator');

function formatZodError(err) {
  return err.issues.map(e => ({ path: e.path.join('.'), message: e.message }));
}

async function store(req, res, next) {
  try {
    const orderId = parseInt(req.params.id, 10);
    if (isNaN(orderId)) {
      return res.status(400).json({ success: false, message: 'ID Pesanan harus berupa angka' });
    }
    const validated = reviewSchema.parse(req.body);
    const result = await reviewService.submitReview(req.user.id, orderId, validated);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ success: false, errors: formatZodError(err) });
    }
    next(err);
  }
}

async function productReviews(req, res, next) {
  try {
    const productId = parseInt(req.params.id, 10);
    if (isNaN(productId)) {
      return res.status(400).json({ success: false, message: 'ID Produk harus berupa angka' });
    }
    const result = await reviewService.listReviewsForProduct(productId);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  store,
  productReviews,
};
