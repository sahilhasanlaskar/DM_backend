const Dataset = require('../models/datasetModel');
const datasetValidationSchema = require('../validations/datasetValidation');
const crypto = require('crypto');
const fs = require('fs');

const alpha = 20; // Base price (α)
const beta = 166663.33; // Slope factor (β)

function calculatePrice(numRecords) {
    // Logarithmic pricing formula: P(|S(t)|) = β * log(|S(t)|) + α
    //const price = beta * Math.log10(numRecords) + alpha;

    const price = 10;
    return price;
}

const uploadDataset = async (req, res) => {
    try {
        const user = req.user; // Get user object from auth middleware
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        if (user.role !== 'Data Provider') {
            return res.status(403).json({ msg: 'Only Data Providers can upload datasets' });
        }

        const { datasetName, description, category, numberOfRecords, source, licenseType, dataQualityMetrics, keywords, languages, dataCollectionMethodology, privacyCompliance } = req.body;

        const numRecords = parseInt(numberOfRecords);
        if (isNaN(numRecords)) {
            return res.status(400).json({ msg: 'Number of records must be a valid number' });
        }

        const parsedKeywords = JSON.parse(keywords);
        const parsedLanguages = JSON.parse(languages);

        const validation = datasetValidationSchema.safeParse({
            datasetName,
            description,
            category,
            numberOfRecords: numRecords,
            source,
            licenseType,
            dataQualityMetrics,
            keywords: parsedKeywords,
            languages: parsedLanguages,
            dataCollectionMethodology,
            privacyCompliance
        });

        if (!validation.success) {
            return res.status(400).json(validation.error.errors);
        }
        const file = req.file;
        if (!file) {
            return res.status(400).json({ msg: 'File is required' });
        }

        const fileSize = file.size; // File size in bytes
        const lastUpdated = new Date();
        const checksum = crypto.createHash('sha256').update(fs.readFileSync(file.path)).digest('hex');

        // Calculate pricing
        const price = calculatePrice(numRecords);

        const newDataset = new Dataset({
            datasetName,
            description,
            category,
            fileSize,
            numberOfRecords: numRecords,
            source,
            licenseType,
            dataQualityMetrics,
            keywords: parsedKeywords,
            lastUpdated,
            languages: parsedLanguages,
            dataCollectionMethodology,
            privacyCompliance,
            checksum,
            filePath: file.path,
            price,            
            uploadedBy: user._id,
            walletAddress: user.walletAddress 
        });

        await newDataset.save();

        res.status(201).json({ msg: 'Dataset uploaded successfully', price });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

const getDatasets = async (req, res) => {
    try {
        const datasets = await Dataset.find().populate('uploadedBy', 'name email');
        res.json(datasets);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

const queryDatasets = async (req, res) => {
    try {
        const {
            datasetName,
            category,
            licenseType,
            minPrice,
            maxPrice,
            minFileSize,
            maxFileSize,
            minRecords,
            maxRecords,
            keywords,
            languages,
            uploadedBy,
            walletAddress,
            sortBy,
            sortOrder,
            page = 1,
            limit = 10
        } = req.query;

        const query = {};
        
        if (datasetName) query.datasetName = { $regex: datasetName, $options: 'i' };
        if (category) query.category = { $regex: category, $options: 'i' };
        if (licenseType) query.licenseType = { $regex: licenseType, $options: 'i' };
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = parseFloat(minPrice);
            if (maxPrice) query.price.$lte = parseFloat(maxPrice);
        }
        if (minFileSize || maxFileSize) {
            query.fileSize = {};
            if (minFileSize) query.fileSize.$gte = parseInt(minFileSize);
            if (maxFileSize) query.fileSize.$lte = parseInt(maxFileSize);
        }
        if (minRecords || maxRecords) {
            query.numberOfRecords = {};
            if (minRecords) query.numberOfRecords.$gte = parseInt(minRecords);
            if (maxRecords) query.numberOfRecords.$lte = parseInt(maxRecords);
        }
        if (keywords) query.keywords = { $in: keywords.split(',') };
        if (languages) query.languages = { $in: languages.split(',') };
        if (uploadedBy) query.uploadedBy = uploadedBy;
        if (walletAddress) query.walletAddress = { $regex: walletAddress, $options: 'i' };

        const sort = {};
        if (sortBy) {
            sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
        }

        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sort,
            populate: { path: 'uploadedBy', select: 'name email' }
        };

        const result = await Dataset.paginate(query, options);

        res.json({
            datasets: result.docs,
            totalPages: result.totalPages,
            currentPage: result.page,
            totalDatasets: result.totalDocs
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

module.exports = { uploadDataset, getDatasets, queryDatasets };
