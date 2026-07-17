const { z } = require('zod');

const membershipConfigSchema = z.object({
  pointsPerRupiah: z.coerce.number({
    required_error: 'Points per rupiah wajib diisi',
  }).positive('Points per rupiah harus bernilai positif'),
  pointsThresholdForMember: z.coerce.number({
    required_error: 'Points threshold wajib diisi',
  }).int('Points threshold harus berupa bilangan bulat').positive('Points threshold harus bernilai positif'),
  memberDiscountPercent: z.coerce.number({
    required_error: 'Member discount percent wajib diisi',
  }).min(0, 'Diskon member minimal 0%').max(100, 'Diskon member maksimal 100%'),
  minimumOrderKg: z.coerce.number({
    required_error: 'Minimum order kg wajib diisi',
  }).positive('Minimum order kg harus bernilai positif'),
});

module.exports = {
  membershipConfigSchema,
};
