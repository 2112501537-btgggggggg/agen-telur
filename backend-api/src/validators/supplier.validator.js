const { z } = require('zod');

const supplierSchema = z.object({
  name: z.string({
    required_error: 'Nama supplier wajib diisi',
  }).min(1, 'Nama supplier tidak boleh kosong'),
  contact: z.string({
    required_error: 'Kontak supplier wajib diisi',
  }).min(1, 'Kontak supplier tidak boleh kosong'),
  address: z.string().optional().nullable(),
});

module.exports = {
  supplierSchema,
};
