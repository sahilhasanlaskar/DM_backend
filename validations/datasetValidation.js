const { z } = require('zod');

const datasetValidationSchema = z.object({
    datasetName: z.string().min(1, 'Dataset name is required'),
    description: z.string().min(1, 'Short description is required'),
    category: z.string().min(1, 'Category/Domain is required'),
    numberOfRecords: z.number().int().positive(),
    source: z.string().min(1, 'Source of data is required'),
    licenseType: z.string().min(1, 'License type is required'),
    dataQualityMetrics: z.string().min(1, 'Data quality metrics are required'),
    keywords: z.array(z.string().min(1)),
    languages: z.array(z.string().min(1)),
    dataCollectionMethodology: z.string().min(1, 'Data collection methodology is required'),
    privacyCompliance: z.string().min(1, 'Privacy and compliance information is required')
});

module.exports = datasetValidationSchema;
