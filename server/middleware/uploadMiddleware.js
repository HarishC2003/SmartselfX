import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Assure paths
const uploadDir = path.join(process.cwd(), 'uploads');
const productsDir = path.join(uploadDir, 'products');

[uploadDir, productsDir].forEach((dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// CSV memory upload configuration (5MB limit)
export const uploadCsv = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: function (req, file, cb) {
        if (file.mimetype === 'text/csv' || file.mimetype === 'application/vnd.ms-excel' || file.originalname.endsWith('.csv')) {
            cb(null, true);
        } else {
            cb(new Error('Only CSV files are allowed'));
        }
    }
});

// Image disk upload configuration (2MB limit)
const imageStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, productsDir);
    },
    filename: function (req, file, cb) {
        // Just gen a unique name; we'll rename it dynamically in the controller where we have access to the SKU
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, 'temp-' + uniqueSuffix + path.extname(file.originalname).toLowerCase());
    }
});

export const uploadImage = multer({
    storage: imageStorage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png|webp/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only standard images (jpeg, jpg, png, webp) are allowed'));
        }
    }
});
