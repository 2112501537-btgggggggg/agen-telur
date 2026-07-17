const { z } = require('zod');

const serviceAreaSchema = z.object({
  city: z.string({
    required_error: 'Kota/kabupaten wajib diisi',
  }).min(1, 'Kota/kabupaten tidak boleh kosong'),
  kecamatan: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

module.exports = {
  serviceAreaSchema,
};
