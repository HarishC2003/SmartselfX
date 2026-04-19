import express from 'express';
import {
    getSystemSettings,
    updateSystemSettings,
    getProfileSettings,
    updateProfileSettings,
    changePassword,
    uploadCompanyLogo
} from '../controllers/settingsController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { adminOnly, allRoles } from '../middleware/roleMiddleware.js';
import { validateUpdateSettings } from '../middleware/validationMiddleware.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(process.cwd(), 'uploads', 'logos');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, `company_logo_${Date.now()}${path.extname(file.originalname)}`);
    }
});
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mime = allowedTypes.test(file.mimetype);
    if (ext && mime) {
        cb(null, true);
    } else {
        cb(new Error('Only JPG, PNG, and WebP images are allowed'));
    }
};
const upload = multer({ 
    storage, 
    limits: { fileSize: 1024 * 1024 * 1 },
    fileFilter
});

router.use(verifyToken);

router.get('/profile', allRoles, getProfileSettings);
router.put('/profile', allRoles, updateProfileSettings);
router.put('/password', allRoles, changePassword);

router.get('/', allRoles, getSystemSettings);
router.put('/', adminOnly, validateUpdateSettings, updateSystemSettings);
router.post('/logo', adminOnly, upload.single('logo'), uploadCompanyLogo);

export default router;
