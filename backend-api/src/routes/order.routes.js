const express = require('express');
const { validateCheckout } = require('../controllers/checkout.controller');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.post('/validate', validateCheckout);

module.exports = router;
