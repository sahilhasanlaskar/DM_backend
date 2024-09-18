const express = require('express');
const { uploadIdentityCard } = require('../controllers/authController');
const verifyIdMiddleware = require('../middlewares/verifyIdMiddlware.js');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/upload', authMiddleware, verifyIdMiddleware, uploadIdentityCard);

module.exports = router;
