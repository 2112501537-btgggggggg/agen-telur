const { z } = require('zod');

const stockInSchema = z.object({
  supplierId: z.coerce.number({
    required_error: 'Supplier ID wajib diisi',
  }).int(),
  productVariantId: z.coerce.number({
    required_error: 'Product Variant ID wajib diisi',
  }).int(),
  quantityKg: z.coerce.number({
    required_error: 'Quantity Kg wajib diisi',
  }).positive('Quantity Kg harus bernilai positif'),
  pricePerKg: z.coerce.number({
    required_error: 'Price Per Kg wajib diisi',
  }).positive('Price Per Kg harus bernilai positif'),
});

module.exports = {
  stockInSchema,
};
