const { z } = require('zod');

const reviewSchema = z.object({
  rating: z.coerce.number({
    required_error: 'Rating wajib diisi',
    invalid_type_error: 'Rating harus berupa angka',
  }).int('Rating harus berupa bilangan bulat').min(1, 'Rating minimal 1').max(5, 'Rating maksimal 5'),
  comment: z.string({
    invalid_type_error: 'Komentar harus berupa teks',
  }).optional(),
  damagedEggCount: z.coerce.number({
    invalid_type_error: 'Jumlah telur cacat harus berupa angka',
  }).int('Jumlah telur cacat harus bilangan bulat').min(0, 'Jumlah telur cacat minimal 0').optional(),
});

module.exports = { reviewSchema };
