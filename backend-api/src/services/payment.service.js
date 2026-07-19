const prisma = require('../utils/prisma');
const AppError = require('../utils/AppError');
const { verifySignature } = require('../utils/midtransSignature.util');

async function handleMidtransNotification(payload) {
  // 1. Verifikasi Signature
  const isValid = verifySignature(payload);
  if (!isValid) {
    throw new AppError(401, 'Signature tidak valid');
  }

  // 2. Cari Order
  const order = await prisma.order.findUnique({
    where: { orderNumber: payload.order_id },
  });

  if (!order) {
    throw new AppError(404, `Order dengan nomor ${payload.order_id} tidak ditemukan`);
  }

  // 3. Petakan transaction_status
  let mappedPaymentStatus = order.paymentStatus;
  const status = payload.transaction_status;
  const fraud = payload.fraud_status;

  if (status === 'settlement') {
    mappedPaymentStatus = 'PAID';
  } else if (status === 'capture') {
    if (fraud === 'accept') {
      mappedPaymentStatus = 'PAID';
    } else {
      mappedPaymentStatus = 'FAILED';
    }
  } else if (status === 'deny' || status === 'cancel') {
    mappedPaymentStatus = 'FAILED';
  } else if (status === 'expire') {
    mappedPaymentStatus = 'EXPIRED';
  } else if (status === 'pending') {
    mappedPaymentStatus = 'UNPAID';
  }

  // 4. Update order (Idempotent: prisma.order.update is safe even if called multiple times)
  await prisma.order.update({
    where: { id: order.id },
    data: {
      paymentStatus: mappedPaymentStatus,
      paymentChannel: payload.payment_type || null,
      midtransTransactionId: payload.transaction_id || null,
    },
  });

  return { success: true };
}

module.exports = {
  handleMidtransNotification,
};
