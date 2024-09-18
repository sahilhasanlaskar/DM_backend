// validations/userValidation.js
const { z } = require('zod');

const userValidationSchema = z.object({
    walletAddress: z.string().min(1, 'Wallet address is required'),
    name: z.string().min(1, 'Name is required'),
    age: z.string(),
    institute: z.string().min(1, 'Institute is required'),
    email: z.string().email('Invalid email'),
    address: z.string().min(1, 'Address is required'),
    city: z.string().min(1, 'City is required'),
    postalCode: z.string().min(1, 'Postal code is required'),
    role: z.enum(['Data Provider', 'Data Consumer'], 'Role must be either "Data Provider" or "Data Consumer"'),
});

module.exports = userValidationSchema;
