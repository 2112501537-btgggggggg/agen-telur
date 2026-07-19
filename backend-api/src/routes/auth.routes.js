const express = require('express');
const { register, login, adminLogin, me, refreshToken, logout } = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const { registerSchema, loginSchema } = require('../validators/auth.validator');

const router = express.Router();

// POST /api/auth/register
router.post('/register', validate(registerSchema), register);

// POST /api/auth/login
router.post('/login', validate(loginSchema), login);

// POST /api/auth/admin/login
router.post('/admin/login', validate(loginSchema), adminLogin);

// GET /api/auth/me
router.get('/me', authMiddleware, me);

// POST /api/auth/refresh-token
router.post('/refresh-token', refreshToken);

// POST /api/auth/logout
router.post('/logout', logout);

module.exports = router;
