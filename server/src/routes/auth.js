const express = require('express');
const { login, me } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Login
router.post('/login', login);

// Current user by token
router.get('/me', authenticate, me);

module.exports = router;


