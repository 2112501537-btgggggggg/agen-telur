const { z } = require('zod');

const validateCheckoutSchema = z.object({
  addressId: z.coerce.number({
    required_error: 'Address ID wajib diisi',
  }).int('Address ID harus berupa bilangan bulat'),
  items: z.array(
    z.object({
      productVariantId: z.coerce.number({
        required_error: 'Product Variant ID wajib diisi',
      }).int('Product Variant ID harus berupa bilangan bulat'),
      unit: z.enum(['KG', 'TRAY', 'PETI'], {
        required_error: 'Unit wajib diisi',
        invalid_type_error: 'Unit harus bernilai KG, TRAY, atau PETI',
      }),
      quantity: z.coerce.number({
        required_error: 'Quantity wajib diisi',
      }).positive('Quantity harus bernilai positif'),
    })
  ).min(1, 'Items minimal berisi 1 barang'),
});

module.exports = {
  validateCheckoutSchema,
};
