const { z } = require('zod');

const addressSchema = z.object({
  label: z.string({
    required_error: 'Label alamat wajib diisi',
  }).min(1, 'Label alamat tidak boleh kosong'),
  fullAddress: z.string({
    required_error: 'Alamat lengkap wajib diisi',
  }).min(10, 'Alamat lengkap minimal 10 karakter'),
  kecamatan: z.string({
    required_error: 'Kecamatan wajib diisi',
  }).min(1, 'Kecamatan tidak boleh kosong'),
  city: z.string({
    required_error: 'Kota/Kabupaten wajib diisi',
  }).min(1, 'Kota/Kabupaten tidak boleh kosong'),
  isDefault: z.boolean().optional(),
});

module.exports = { addressSchema };
