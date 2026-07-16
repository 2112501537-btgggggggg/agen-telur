const express = require('express');
const { register, login, adminLogin, me, refreshToken, logout } = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// POST /api/auth/register
router.post('/register', register);

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/admin/login
router.post('/admin/login', adminLogin);

// GET /api/auth/me
router.get('/me', authMiddleware, me);

// POST /api/auth/refresh-token
router.post('/refresh-token', refreshToken);

// POST /api/auth/logout
router.post('/logout', logout);

module.exports = router;
