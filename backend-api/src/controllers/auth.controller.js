const { registerSchema, loginSchema } = require('../validators/auth.validator');
const { registerUser, loginUser } = require('../services/auth.service');
const { verifyRefreshToken, generateAccessToken } = require('../utils/jwt.util');
const prisma = require('../utils/prisma');

// helper to format Zod errors
function formatZodError(err) {
  return err.issues.map(e => ({ path: e.path.join('.'), message: e.message }));
}

async function register(req, res, next) {
  try {
    const validated = registerSchema.parse(req.body);
    const user = await registerUser(validated);
    res.status(201).json({ success: true, data: user });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ success: false, errors: formatZodError(err) });
    }
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const validated = loginSchema.parse(req.body);
    const result = await loginUser(validated.email, validated.password);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ success: false, errors: formatZodError(err) });
    }
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        totalPoints: true,
        isMember: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

async function refreshToken(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token diperlukan' });
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Refresh token tidak valid atau kedaluwarsa' });
    }

    const newAccessToken = generateAccessToken({ id: decoded.id, role: decoded.role });
    res.status(200).json({ success: true, data: { accessToken: newAccessToken } });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  res.status(200).json({ success: true, message: 'Logout berhasil' });
}

module.exports = { register, login, me, refreshToken, logout };
