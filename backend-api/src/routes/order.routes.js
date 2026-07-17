const express = require('express');
const { validateCheckout } = require('../controllers/checkout.controller');
const { store } = require('../controllers/order.controller');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.post('/validate', validateCheckout);
router.post('/', store);

module.exports = router;
