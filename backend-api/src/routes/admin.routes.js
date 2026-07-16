const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');

const router = express.Router();

// GET /api/admin/ping
router.get('/ping', authMiddleware, requireRole(['ADMIN', 'STAFF']), (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      message: 'pong',
      role: req.user.role,
    },
  });
});

module.exports = router;
