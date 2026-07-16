const { z } = require('zod');

const categorySchema = z.object({
  name: z.string({
    required_error: 'Nama kategori wajib diisi',
    invalid_type_error: 'Nama kategori harus berupa teks',
  }).min(3, 'Nama kategori minimal 3 karakter'),
});

module.exports = { categorySchema };
