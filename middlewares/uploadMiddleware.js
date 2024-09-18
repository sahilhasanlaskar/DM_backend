const multer = require('multer');
const path = require('path');

// Configure storage settings
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

// Configure file filter to accept only JSON and CSV files
const fileFilter = (req, file, cb) => {
    const filetypes = /csv|json/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
        return cb(null, true);
    }
    cb(new Error('File type not supported'));
};

// Configure Multer
const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB file size limit
}).single('dataset'); // Expecting a single file with the field name 'dataset'

module.exports = upload;
