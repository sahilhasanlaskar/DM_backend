const express = require('express');
const { requestChallenge, verifyChallenge, completeSignup } = require('../controllers/authController');

const router = express.Router();

router.post('/request-challenge', requestChallenge);
router.post('/verify-challenge', verifyChallenge);
router.post('/complete-signup', completeSignup);

module.exports = router;
