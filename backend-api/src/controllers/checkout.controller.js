const { validateCheckoutSchema } = require('../validators/checkout.validator');
const checkoutService = require('../services/checkout.service');

function formatZodError(err) {
  return err.issues.map(e => ({ path: e.path.join('.'), message: e.message }));
}

async function validateCheckout(req, res, next) {
  try {
    const validated = validateCheckoutSchema.parse(req.body);
    const result = await checkoutService.validateCheckout(
      req.user.id,
      validated.addressId,
      validated.items
    );
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ success: false, errors: formatZodError(err) });
    }
    next(err);
  }
}

module.exports = {
  validateCheckout,
};
