const express = require('express');
const { index } = require('../controllers/unitConversion.controller');

const router = express.Router();

router.get('/', index);

module.exports = router;
