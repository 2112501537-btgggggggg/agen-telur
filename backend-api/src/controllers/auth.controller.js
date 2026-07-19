const authService = require('../services/auth.service');
const asyncHandler = require('../utils/asyncHandler');
const { verifyRefreshToken, generateAccessToken } = require('../utils/jwt.util');
const prisma = require('../utils/prisma');

const register = asyncHandler(async (req, res) => {
  const user = await authService.registerUser(req.body);
  res.status(201).json({ success: true, data: user });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.loginUser(email, password);
  res.json({ success: true, data: result });
});

const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.loginAdmin(email, password);
  res.json({ success: true, data: result });
});

const me = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true, name: true, email: true, phone: true,
      role: true, totalPoints: true, isMember: true,
      createdAt: true, updatedAt: true,
    },
  });
  if (!user) {
    return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
  }
  res.json({ success: true, data: user });
});

const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ success: false, message: 'Refresh token diperlukan' });
  }
  let decoded;
  try { decoded = verifyRefreshToken(refreshToken); }
  catch (err) { return res.status(401).json({ success: false, message: 'Refresh token tidak valid atau kedaluwarsa' }); }
  const newAccessToken = generateAccessToken({ id: decoded.id, role: decoded.role });
  res.json({ success: true, data: { accessToken: newAccessToken } });
});

const logout = asyncHandler(async (req, res) => {
  res.json({ success: true, message: 'Logout berhasil' });
});

module.exports = { register, login, adminLogin, me, refreshToken, logout };
