const express = require('express');
const { getUserDetails } = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/profile', authMiddleware, getUserDetails);

module.exports = router;