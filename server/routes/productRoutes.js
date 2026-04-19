import express from 'express';
import {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    getProductStats,
    importProductsCSV,
    exportProductsCSV,
    uploadProductImage
} from '../controllers/productController.js';

import { verifyToken } from '../middleware/authMiddleware.js';
import { adminOnly, adminOrManager, allRoles } from '../middleware/roleMiddleware.js';
import { uploadCsv, uploadImage } from '../middleware/uploadMiddleware.js';
import { createAuditMiddleware } from '../middleware/auditMiddleware.js';
import { validateCreateProduct } from '../middleware/validationMiddleware.js';

const router = express.Router();

router.use(verifyToken);

router.get('/stats', allRoles, getProductStats);
router.get('/export', adminOrManager, exportProductsCSV);
router.post('/import', adminOnly, uploadCsv.single('csvFile'), importProductsCSV);

router.get('/', allRoles, getAllProducts);
router.post('/', adminOnly, 
    createAuditMiddleware('PRODUCT_CREATED', 'Product', (req, res) => ({
        resourceId: res.locals.createdId,
        resourceName: res.locals.createdName
    })), 
validateCreateProduct, createProduct);

router.get('/:id', allRoles, getProductById);

router.put('/:id', adminOnly, 
    createAuditMiddleware('PRODUCT_UPDATED', 'Product', (req, res) => ({
        resourceId: res.locals.updatedId,
        resourceName: res.locals.updatedName
    })), 
updateProduct);

router.delete('/:id', adminOnly, 
    createAuditMiddleware('PRODUCT_DELETED', 'Product', (req, res) => ({
        resourceId: res.locals.deletedId,
        resourceName: res.locals.deletedName
    }), 'WARNING'), 
deleteProduct);

router.post('/:id/image', adminOnly, uploadImage.single('image'), uploadProductImage);

export default router;
