import express from 'express';
import {
    createPO,
    getAllPOs,
    getPOById,
    approvePO,
    rejectPO,
    markDispatched,
    markReceived,
    cancelPO,
    getPOStats,
    getAIRecommendations
} from '../controllers/purchaseOrderController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { adminOrManager, allRoles, vendorOnly } from '../middleware/roleMiddleware.js';
import { validateCreatePO } from '../middleware/validationMiddleware.js';

const router = express.Router();

router.use(verifyToken);

router.get('/stats', allRoles, getPOStats);
router.get('/recommendations', adminOrManager, getAIRecommendations);

router.get('/', allRoles, getAllPOs);
router.post('/', adminOrManager, validateCreatePO, createPO);

router.get('/:id', allRoles, getPOById);
router.patch('/:id/approve', vendorOnly, approvePO);
router.patch('/:id/reject', vendorOnly, rejectPO);
router.patch('/:id/dispatch', vendorOnly, markDispatched);
router.patch('/:id/receive', adminOrManager, markReceived);
router.patch('/:id/cancel', adminOrManager, cancelPO);

export default router;
