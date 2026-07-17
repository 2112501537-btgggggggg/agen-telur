const express = require('express');
const { midtransWebhook } = require('../controllers/payment.controller');

const router = express.Router();

router.post('/midtrans/webhook', midtransWebhook);

module.exports = router;
