const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Login
router.post('/login', authController.login);

// Recover password (placeholder)
router.post('/recover', authController.recover);

module.exports = router;
