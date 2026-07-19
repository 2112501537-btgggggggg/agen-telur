const bcrypt = require('bcryptjs');
const prisma = require('../utils/prisma');
const AppError = require('../utils/AppError');

/**
 * Register a new user.
 */
async function registerUser({ name, email, phone, password }) {
  // check duplicate email
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError(409, 'Email sudah terdaftar');
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      phone,
      password: hashed,
      role: 'CUSTOMER', // default role
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return user;
}

const { generateAccessToken, generateRefreshToken } = require('../utils/jwt.util');

/**
 * Login a user.
 */
async function loginUser(email, password) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AppError(401, 'Email atau password salah');
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    throw new AppError(401, 'Email atau password salah');
  }

  const payload = { id: user.id, role: user.role };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  const { password: _, ...userWithoutPassword } = user;

  return {
    accessToken,
    refreshToken,
    user: userWithoutPassword,
  };
}

async function loginAdmin(email, password) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AppError(401, 'Email atau password salah');
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    throw new AppError(401, 'Email atau password salah');
  }

  if (user.role !== 'ADMIN' && user.role !== 'STAFF') {
    throw new AppError(403, 'Akun ini bukan akun admin/staff');
  }

  const payload = { id: user.id, role: user.role };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  const { password: _, ...userWithoutPassword } = user;

  return {
    accessToken,
    refreshToken,
    user: userWithoutPassword,
  };
}

module.exports = { registerUser, loginUser, loginAdmin };
