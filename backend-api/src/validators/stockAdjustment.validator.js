const { z } = require('zod');

const stockAdjustmentSchema = z.object({
  changeKg: z.coerce.number({
    required_error: 'Perubahan stok wajib diisi',
    invalid_type_error: 'Perubahan stok harus berupa angka',
  }).refine(val => val !== 0, {
    message: 'Perubahan stok tidak boleh bernilai nol (0)',
  }),
  reason: z.string({
    required_error: 'Alasan penyesuaian wajib diisi',
  }).min(3, 'Alasan penyesuaian minimal 3 karakter'),
});

module.exports = {
  stockAdjustmentSchema,
};
