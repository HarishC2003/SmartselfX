import express from 'express';
import { 
    getExecutiveSummary, 
    getInventoryHealth, 
    getPurchaseVsSales, 
    getTopPerformers, 
    exportReport 
} from '../controllers/reportController.js';
import { verifyRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// All reporting routes require ADMIN or MANAGER role
router.use(verifyRole('ADMIN', 'MANAGER'));

/**
 * @swagger
 * /api/reports/dashboard-kpis:
 *   get:
 *     summary: GET /dashboard-kpis
 *     tags: [Report]
 *     responses:
 *       200:
 *         description: Successful operation
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.get('/dashboard-kpis', getExecutiveSummary);
/**
 * @swagger
 * /api/reports/inventory-health:
 *   get:
 *     summary: GET /inventory-health
 *     tags: [Report]
 *     responses:
 *       200:
 *         description: Successful operation
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.get('/inventory-health', getInventoryHealth);
/**
 * @swagger
 * /api/reports/purchase-sales-comparison:
 *   get:
 *     summary: GET /purchase-sales-comparison
 *     tags: [Report]
 *     responses:
 *       200:
 *         description: Successful operation
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.get('/purchase-sales-comparison', getPurchaseVsSales);
/**
 * @swagger
 * /api/reports/top-performers:
 *   get:
 *     summary: GET /top-performers
 *     tags: [Report]
 *     responses:
 *       200:
 *         description: Successful operation
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.get('/top-performers', getTopPerformers);
/**
 * @swagger
 * /api/reports/export:
 *   get:
 *     summary: GET /export
 *     tags: [Report]
 *     responses:
 *       200:
 *         description: Successful operation
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.get('/export', exportReport);

export default router;
