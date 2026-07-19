const { validateCheckoutSchema } = require('../validators/checkout.validator');
const checkoutService = require('../services/checkout.service');
const asyncHandler = require('../utils/asyncHandler');

const validateCheckout = asyncHandler(async (req, res) => {
    const validated = validateCheckoutSchema.parse(req.body);
    const result = await checkoutService.validateCheckout(
      req.user.id,
      validated.addressId,
      validated.items
    );
    res.status(200).json({ success: true, data: result });});

module.exports = {
  validateCheckout,
};
