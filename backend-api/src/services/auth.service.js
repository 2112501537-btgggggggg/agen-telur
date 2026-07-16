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

module.exports = { registerUser };
