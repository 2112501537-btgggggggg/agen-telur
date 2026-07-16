const { z } = require('zod');

const productSchema = z.object({
  name: z.string({
    required_error: 'Nama produk wajib diisi',
  }).min(1, 'Nama produk tidak boleh kosong'),
  categoryId: z.coerce.number({
    required_error: 'Category ID wajib diisi',
    invalid_type_error: 'Category ID harus berupa angka',
  }).int('Category ID harus berupa integer'),
  description: z.string().optional().nullable(),
});

const variantSchema = z.object({
  grade: z.enum(['BESAR', 'SEDANG', 'KECIL'], {
    error_map: () => ({ message: 'Grade harus berupa BESAR, SEDANG, atau KECIL' }),
  }),
  pricePerKg: z.coerce.number({
    required_error: 'Harga per kg wajib diisi',
  }).positive('Harga per kg harus bernilai positif'),
  stockKg: z.coerce.number().min(0, 'Stok tidak boleh negatif').default(0),
  lowStockThreshold: z.coerce.number().min(0, 'Threshold tidak boleh negatif').default(10),
});

module.exports = {
  productSchema,
  variantSchema,
};
