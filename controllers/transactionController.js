const Transaction = require('../models/transactionModel');
const Dataset = require('../models/datasetModel');
const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const blockfrostAPIKey = process.env.BLOCKFROST_API_KEY;
const blockfrostBaseURL = 'https://cardano-preprod.blockfrost.io/api/v0';

const initiatePurchase = async (req, res) => {
    try {
        const { datasetId, transactionHash } = req.body;
        const userId = req.user; 

        const dataset = await Dataset.findById(datasetId);
        if (!dataset) {
            return res.status(404).json({ msg: 'Dataset not found' });
        }

        const newTransaction = new Transaction({
            buyer: userId,
            dataset: datasetId,
            transactionHash,
            checksum: dataset.checksum
        });

        await newTransaction.save();

        res.status(201).json({ msg: 'Transaction initiated', transactionId: newTransaction._id });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

const verifyTransaction = async (transactionId) => {
    try {
        const transaction = await Transaction.findById(transactionId).populate('dataset');
        if (!transaction || transaction.status !== 'Pending') {
            return { success: false, msg: 'Transaction not found or already processed' };
        }

        const response = await axios.get(`${blockfrostBaseURL}/txs/${transaction.transactionHash}`, {
            headers: { project_id: blockfrostAPIKey }
        });

        if (response.data && response.data.valid_contract && response.data.output_amount.length > 0) {
            if (response.data.metadata && response.data.metadata[transaction.dataset.checksum]) {
                transaction.status = 'Success';
            } else {
                transaction.status = 'Success';
            }
            transaction.verifiedAt = new Date();
        } else {
            transaction.status = 'Failed';
        }

        await transaction.save();
        return { success: transaction.status === 'Success', msg: 'Transaction verified' };
    } catch (err) {
        console.error(err.message);
        return { success: false, msg: 'Verification failed' };
    }
};

const checkPaymentStatus = async (req, res) => {
    try {
        const { transactionId } = req.params;
        const transaction = await Transaction.findById(transactionId).populate('dataset');

        if (!transaction) {
            return res.status(404).json({ msg: 'Transaction not found' });
        } else if (transaction.status === 'Pending') {
            const verificationResult = await verifyTransaction(transactionId);

            if (verificationResult.success) {
                transaction.status = 'Success';
            } else if ((Date.now() - transaction.createdAt.getTime()) > 600000) {
                transaction.status = 'Failed';
            }

            await transaction.save();
        }

        res.status(200).json({
            status: transaction.status,
            msg: transaction.status === 'Success' ? 'Payment verified' : 'Payment pending or failed'
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};


const getBoughtDatasets = async (req, res) => {
    try {
        const userId = req.user;
        console.log(req.user);
        const transactions = await Transaction.find({ buyer: userId, status: 'Success' }).populate('dataset');

        const datasets = transactions.map(transaction => ({
            transaction,
            dataset: transaction.dataset,
            downloadLink: `/api/transactions/download/${transaction.dataset._id}`
        }));

        res.json(datasets);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

const rateDataset = async (req, res) => {
    try {
        const { transactionId, ratings } = req.body;
        const userId = req.user;

        const transaction = await Transaction.findById(transactionId);

        if (!transaction || transaction.buyer.toString() !== userId._id.toString() || transaction.status !== 'Success') {

            return res.status(404).json({ msg: 'Transaction not found or unauthorized' });
        }

        // Check if already rated
        const isRated = transaction.ratings && Object.values(transaction.ratings).some(value => value !== undefined);
        if (isRated) {
            return res.status(400).json({ msg: 'This dataset has already been rated' });
        }

        // Store ratings in the transaction
        transaction.ratings = {
            relevance: ratings.relevance,
            quality: ratings.quality,
            size: ratings.size,
            accessibility: ratings.accessibility,
            bias: ratings.bias
        };
        await transaction.save();

        // Update dataset average ratings
        const dataset = await Dataset.findById(transaction.dataset);
        const totalRatings = dataset.ratingCount * dataset.averageRating;
        const newRating = (ratings.relevance + ratings.quality + ratings.size + ratings.accessibility + ratings.bias) / 5;

        dataset.ratingCount += 1;
        dataset.averageRating = (totalRatings + newRating) / dataset.ratingCount;

        await dataset.save();

        res.json({ msg: 'Rating submitted successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

const verifyRatings = async (transactionId) => {
    try {
        const transaction = await Transaction.findById(transactionId).populate('dataset');
        if (!transaction || transaction.status !== 'Success') {
            return { success: false, msg: 'Transaction not found or not successful' };
        }

        const response = await axios.get(`${blockfrostBaseURL}/txs/${transaction.transactionHash}/metadata`, {
            headers: { project_id: blockfrostAPIKey }
        });

        const metadata = response.data;
        const expectedMetadata = {
            relevance: transaction.ratings.relevance,
            quality: transaction.ratings.quality,
            size: transaction.ratings.size,
            accessibility: transaction.ratings.accessibility,
            bias: transaction.ratings.bias
        };

        const isValid = metadata.some(md => JSON.stringify(md.json) === JSON.stringify(expectedMetadata));

        return isValid
            ? { success: true, msg: 'Ratings verified successfully' }
            : { success: false, msg: 'Ratings do not match blockchain metadata' };
    } catch (err) {
        console.error(err.message);
        return { success: false, msg: 'Verification failed' };
    }
};

const verifyChecksum = async (req, res) => {
    try {
        const { transactionId } = req.params;

        // Fetch the transaction from the database
        const transaction = await Transaction.findById(transactionId).populate('dataset');
        if (!transaction) {
            return res.status(404).json({ msg: 'Transaction not found' });
        }

        // Retrieve the file path from the dataset
        const filePath = transaction.dataset.filePath;
        if (!filePath) {
            return res.status(400).json({ msg: 'File path not found in dataset' });
        }

        // Check if the file exists in the file system
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ msg: 'File not found in the file system' });
        }

        // Calculate the checksum of the file
        const fileBuffer = fs.readFileSync(filePath);
        const calculatedChecksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');

        // Fetch the transaction metadata from the Cardano blockchain
        const response = await axios.get(`${blockfrostBaseURL}/txs/${transaction.transactionHash}/metadata`, {
            headers: { project_id: blockfrostAPIKey }
        });

        const metadata = response.data.find(md => md.label === '1');
        if (!metadata || !metadata.json_metadata || !metadata.json_metadata.checksum) {
            return res.status(400).json({ msg: 'Checksum not found in transaction metadata' });
        }

        const blockchainChecksum = metadata.json_metadata.checksum;

        // Compare the checksums
        if (calculatedChecksum === blockchainChecksum) {
            return res.status(200).json({ msg: 'Checksum verified successfully' });
        } else {
            return res.status(400).json({ msg: 'Checksum verification failed' });
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};


const getPendingTransactions = async (req, res) => {
    try {
        const userId = req.user._id;
        const pendingTransactions = await Transaction.find({ buyer: userId, status: 'Pending' }).populate('dataset');
        
        res.status(200).json(pendingTransactions);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

const downloadDataset = async (req, res) => {
    try {
        const userId = req.user;
        const { datasetId } = req.params;

        console.log("Downloading dataset ", datasetId);

        const transaction = await Transaction.findOne({ buyer: userId, dataset: datasetId, status: 'Success' }).populate('dataset');
        if (!transaction) {
            return res.status(404).json({ msg: 'Dataset not found or not purchased' });
        }

        const filePath = transaction.dataset.filePath;
        if (!filePath || !fs.existsSync(filePath)) {
            return res.status(404).json({ msg: 'File not found' });
        }

        res.download(filePath);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

module.exports = { 
    initiatePurchase, 
    checkPaymentStatus, 
    getBoughtDatasets, 
    rateDataset, 
    verifyRatings, 
    verifyChecksum, 
    getPendingTransactions,
    downloadDataset
};
