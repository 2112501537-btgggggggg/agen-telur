const { createOrderSchema, updateStatusSchema } = require('../validators/order.validator');
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

async function index(req, res, next) {
  try {
    const result = await orderService.listOrders(req.user.id, req.query);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function show(req, res, next) {
  try {
    const orderId = parseInt(req.params.id, 10);
    if (isNaN(orderId)) {
      return res.status(400).json({ success: false, message: 'ID Pesanan harus berupa angka' });
    }
    const result = await orderService.getOrderDetail(req.user.id, orderId);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function adminIndex(req, res, next) {
  try {
    const result = await orderService.listOrdersAdmin(req.query);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function adminShow(req, res, next) {
  try {
    const orderId = parseInt(req.params.id, 10);
    if (isNaN(orderId)) {
      return res.status(400).json({ success: false, message: 'ID Pesanan harus berupa angka' });
    }
    const result = await orderService.getOrderDetailAdmin(orderId);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function updateStatus(req, res, next) {
  try {
    const validated = updateStatusSchema.parse(req.body);
    const orderId = parseInt(req.params.id, 10);
    if (isNaN(orderId)) {
      return res.status(400).json({ success: false, message: 'ID Pesanan harus berupa angka' });
    }
    const result = await orderService.updateOrderStatus(orderId, validated.status);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ success: false, errors: formatZodError(err) });
    }
    next(err);
  }
}

async function cancelOrder(req, res, next) {
  try {
    const orderId = parseInt(req.params.id, 10);
    if (isNaN(orderId)) {
      return res.status(400).json({ success: false, message: 'ID Pesanan harus berupa angka' });
    }
    const result = await orderService.cancelOrder(orderId);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  store,
  index,
  show,
  adminIndex,
  adminShow,
  updateStatus,
  cancelOrder,
};
