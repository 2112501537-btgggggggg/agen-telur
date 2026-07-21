const express = require('express');
const { showPublic } = require('../controllers/membershipConfig.controller');

const router = express.Router();

router.get('/', showPublic);

module.exports = router;
