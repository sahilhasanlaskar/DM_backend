const multer = require('multer');
const path = require('path');

// Configure storage settings specifically for identity cards
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/identity-cards/'); // Directory for identity cards
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

// Configure file filter to accept only JPEG and PNG files
const fileFilter = (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
        return cb(null, true);
    }
    cb(new Error('Identity card file type not supported. Only JPEG and PNG files are allowed.'));
};

// Configure Multer for identity card upload
const uploadIdentityCard = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB file size limit
}).single('identityCard'); // Expecting a single file with the field name 'identityCard'

module.exports = uploadIdentityCard;
