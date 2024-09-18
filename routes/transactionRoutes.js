// routes/transactionRoutes.js
const express = require('express');
const { initiatePurchase, checkPaymentStatus, getBoughtDatasets, rateDataset, verifyRatings, verifyChecksum, getPendingTransactions, downloadDataset } = require('../controllers/transactionController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/purchase', authMiddleware, initiatePurchase);
router.get('/status/:transactionId', authMiddleware, checkPaymentStatus);
router.get('/bought', authMiddleware, getBoughtDatasets);
router.post('/rate', authMiddleware, rateDataset);
router.get('/verify-ratings/:transactionId', authMiddleware, verifyRatings);
router.get('/verify-checksum/:transactionId', authMiddleware, verifyChecksum);
router.get('/pending', authMiddleware, getPendingTransactions);
router.get('/download/:datasetId', authMiddleware, downloadDataset);

module.exports = router;
