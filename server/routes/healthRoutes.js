import express from 'express';
import { 
    getSystemHealth, 
    testEmailConnection, 
    clearOldAuditLogs, 
    getBasicHealth 
} from '../controllers/healthController.js';
import { verifyToken, verifyRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public route
/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: GET /
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Successful operation
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.get('/', getBasicHealth);

// Admin only routes
/**
 * @swagger
 * /api/health/system:
 *   get:
 *     summary: GET /system
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Successful operation
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.get('/system', verifyToken, verifyRole('ADMIN'), getSystemHealth);
/**
 * @swagger
 * /api/health/test-email:
 *   post:
 *     summary: POST /test-email
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Successful operation
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post('/test-email', verifyToken, verifyRole('ADMIN'), testEmailConnection);
/**
 * @swagger
 * /api/health/audit-logs/clear:
 *   delete:
 *     summary: DELETE /audit-logs/clear
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Successful operation
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.delete('/audit-logs/clear', verifyToken, verifyRole('ADMIN'), clearOldAuditLogs);

export default router;
