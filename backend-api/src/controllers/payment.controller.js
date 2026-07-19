const paymentService = require('../services/payment.service');
const asyncHandler = require('../utils/asyncHandler');

async function midtransWebhook(req, res) {
  try {
    const result = await paymentService.handleMidtransNotification(req.body);
    res.status(200).json(result);
  } catch (err) {
    console.error('Midtrans Webhook Error:', err.message);
    // Selalu kembalikan status 200 OK ke Midtrans untuk menghentikan retry otomatis
    res.status(200).json({ success: false, message: err.message });
  }
}

module.exports = {
  midtransWebhook,
};
