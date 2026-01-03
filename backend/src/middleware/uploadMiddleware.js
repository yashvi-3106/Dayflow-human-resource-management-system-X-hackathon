const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage Engine
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // [Timestamp]-[Random]-[OriginalName]
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// File Filter
const fileFilter = (req, file, cb) => {
    // Allowed extensions
    const allowedImages = /jpeg|jpg|png/;
    const allowedDocs = /pdf/;

    const extname = path.extname(file.originalname).toLowerCase();
    const mimetype = file.mimetype;

    // Check header/param context if possible, but standard is broad allow here 
    // and specific validation in route handler if needed, OR separate middlewares.
    // For simplicity, we allow images AND pdfs here.

    if (allowedImages.test(extname) || allowedDocs.test(extname)) {
        return cb(null, true);
    } // else

    cb(new Error('Error: Only Images (jpeg, jpg, png) and PDFs are allowed!'));
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: fileFilter
});

module.exports = upload;
