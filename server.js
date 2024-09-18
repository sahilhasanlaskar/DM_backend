const express = require('express');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const datasetRoutes = require('./routes/datasetRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const verifyRoutes = require('./routes/verifyRoutes');

const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

dotenv.config();

// Ensure the uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

const app = express();

// Connect to the database
connectDB();

// Middleware
app.use(express.json());
app.use(cors()); 

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/datasets', datasetRoutes); // Ensure this route is set up
app.use('/api/transactions', transactionRoutes);
app.use('/api/identity', verifyRoutes);

const PORT = process.env.PORT || 5005;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
