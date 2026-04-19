import express from 'express';
import {
    getExecutiveSummary,
    getInventoryHealth,
    getTransactions,
    getPurchaseOrders,
    getCategories,
    exportExcel,
    exportPDF,
    sendWeeklyReport
} from '../controllers/analyticsController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { adminOrManager } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(verifyToken);
router.use(adminOrManager);

router.get('/executive-summary', getExecutiveSummary);
router.get('/inventory-health', getInventoryHealth);
router.get('/transactions', getTransactions);
router.get('/purchase-orders', getPurchaseOrders);
router.get('/categories', getCategories);
router.get('/export/excel', exportExcel);
router.get('/export/pdf', exportPDF);
router.post('/send-weekly-report', sendWeeklyReport);

export default router;
