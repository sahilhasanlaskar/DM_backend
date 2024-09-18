const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    dataset: { type: mongoose.Schema.Types.ObjectId, ref: 'Dataset', required: true },
    transactionHash: { type: String, required: true, unique: true },
    status: { type: String, enum: ['Pending', 'Success', 'Failed'], default: 'Pending' },
    checksum: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    verifiedAt: { type: Date },
    ratings: {
        relevance: { type: Number, min: 1, max: 5 },
        quality: { type: Number, min: 1, max: 5 },
        size: { type: Number, min: 1, max: 5 },
        accessibility: { type: Number, min: 1, max: 5 },
        bias: { type: Number, min: 1, max: 5 }
    }
});

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
