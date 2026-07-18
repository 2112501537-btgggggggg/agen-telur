const express = require('express');
const { validateCheckout } = require('../controllers/checkout.controller');
const { store, index, show } = require('../controllers/order.controller');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.post('/validate', validateCheckout);
router.post('/', store);
router.get('/', index);
router.get('/:id', show);

module.exports = router;
