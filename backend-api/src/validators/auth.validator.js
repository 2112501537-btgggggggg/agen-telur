const { z } = require('zod');

// Register schema
const registerSchema = z.object({
  name: z.string().min(2, { message: 'Nama terlalu pendek' }),
  email: z.string().email({ message: 'Format email tidak valid' }),
  phone: z.string().min(8, { message: 'Nomor telepon terlalu pendek' }),
  password: z.string().min(8, { message: 'Password minimal 8 karakter' }),
});

// Login schema
const loginSchema = z.object({
  email: z.string().email({ message: 'Format email tidak valid' }),
  password: z.string().min(1, { message: 'Password wajib diisi' }),
});

module.exports = { registerSchema, loginSchema };
