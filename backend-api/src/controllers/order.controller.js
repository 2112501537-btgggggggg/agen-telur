const { createOrderSchema } = require('../validators/order.validator');
const orderService = require('../services/order.service');

function formatZodError(err) {
  return err.issues.map(e => ({ path: e.path.join('.'), message: e.message }));
}

async function store(req, res, next) {
  try {
    const validated = createOrderSchema.parse(req.body);
    const result = await orderService.createOrder(req.user.id, validated);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ success: false, errors: formatZodError(err) });
    }
    next(err);
  }
}

module.exports = {
  store,
};
