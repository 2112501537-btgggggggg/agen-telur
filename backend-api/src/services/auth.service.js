const bcrypt = require('bcryptjs');
const prisma = require('../utils/prisma');

/**
 * Register a new user.
 * @throws {Error} with status 409 if email already exists.
 */
async function registerUser({ name, email, phone, password }) {
  // check duplicate email
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const err = new Error('Email sudah terdaftar');
    err.status = 409;
    throw err;
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
 * @throws {Error} with status 401 if credentials are invalid.
 */
async function loginUser(email, password) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    const err = new Error('Email atau password salah');
    err.status = 401;
    throw err;
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    const err = new Error('Email atau password salah');
    err.status = 401;
    throw err;
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

module.exports = { registerUser, loginUser };
