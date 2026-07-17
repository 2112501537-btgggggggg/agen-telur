const { z } = require('zod');

const updatePriceSchema = z.object({
  newPrice: z.coerce.number({
    required_error: 'Harga baru wajib diisi',
    invalid_type_error: 'Harga baru harus berupa angka',
  }).positive('Harga baru harus bernilai positif'),
});

const bulkUpdatePriceSchema = z.object({
  updates: z.array(
    z.object({
      productVariantId: z.coerce.number({
        required_error: 'Product Variant ID wajib diisi',
      }).int(),
      newPrice: z.coerce.number({
        required_error: 'Harga baru wajib diisi',
      }).positive('Harga baru harus bernilai positif'),
    })
  ).min(1, 'Minimal harus terdapat 1 data pembaruan harga'),
});

module.exports = {
  updatePriceSchema,
  bulkUpdatePriceSchema,
};
