const crypto = require('crypto');

function verifySignature({ order_id, status_code, gross_amount, signature_key }) {
  const raw = order_id + status_code + gross_amount + process.env.MIDTRANS_SERVER_KEY;
  const expectedSignature = crypto.createHash('sha512').update(raw).digest('hex');
  return expectedSignature === signature_key;
}

module.exports = { verifySignature };
