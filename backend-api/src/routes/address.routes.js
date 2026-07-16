const express = require('express');
const { index, store, update, destroy } = require('../controllers/address.controller');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// Apply authMiddleware to all routes in this file
router.use(authMiddleware);

router.get('/', index);
router.post('/', store);
router.put('/:id', update);
router.delete('/:id', destroy);

module.exports = router;
