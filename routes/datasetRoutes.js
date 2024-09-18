const express = require('express');
const { uploadDataset, getDatasets, queryDatasets } = require('../controllers/datasetController');
const authMiddleware = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

const router = express.Router();

router.post('/upload', authMiddleware, upload, uploadDataset);
router.get('/', getDatasets); // New route for fetching datasets
router.get('/query', queryDatasets); // New route for querying datasets

module.exports = router;
