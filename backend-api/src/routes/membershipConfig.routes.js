const express = require('express');
const { show, update } = require('../controllers/membershipConfig.controller');
const authMiddleware = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');

const router = express.Router();

router.use(authMiddleware);
router.use(requireRole(['ADMIN']));

router.get('/', show);
router.put('/', update);

module.exports = router;
