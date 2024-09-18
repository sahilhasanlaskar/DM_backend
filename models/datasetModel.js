const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const datasetSchema = new mongoose.Schema({
    datasetName: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    fileSize: { type: Number, required: true },
    numberOfRecords: { type: Number, required: true },
    source: { type: String, required: true },
    licenseType: { type: String, required: true },
    dataQualityMetrics: { type: String, required: true },
    keywords: { type: [String], required: true },
    lastUpdated: { type: Date, required: true },
    languages: { type: [String], required: true },
    dataCollectionMethodology: { type: String, required: true },
    privacyCompliance: { type: String, required: true },
    checksum: { type: String, required: true },
    filePath: { type: String, required: true },
    price: { type: Number, required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    walletAddress: { type: String, required: true },
    averageRating: { type: Number, default: 0 }, 
    ratingCount: { type: Number, default: 0 },
    ratings: [{
        relevance: { type: Number, min: 1, max: 5 },
        quality: { type: Number, min: 1, max: 5 },
        size: { type: Number, min: 1, max: 5 },
        accessibility: { type: Number, min: 1, max: 5 },
        bias: { type: Number, min: 1, max: 5 }
    }]
});

datasetSchema.plugin(mongoosePaginate);

const Dataset = mongoose.model('Dataset', datasetSchema);

module.exports = Dataset;
