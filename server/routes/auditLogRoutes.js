import express from 'express';
import { listAuditLogs, getAuditStats, getAuditLogById } from '../controllers/auditLogController.js';

const router = express.Router();

/**
 * @swagger
 * /api/audit-logs:
 *   get:
 *     summary: Get paginated audit logs
 *     tags: [Audit Logs]
 *     security: [{ bearerAuth: [] }]
 */
/**
 * @swagger
 * /api/audit-logs:
 *   get:
 *     summary: GET /
 *     tags: [AuditLog]
 *     responses:
 *       200:
 *         description: Successful operation
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.get('/', listAuditLogs);

/**
 * @swagger
 * /api/audit-logs/stats:
 *   get:
 *     summary: Get audit log statistics
 *     tags: [Audit Logs]
 */
/**
 * @swagger
 * /api/audit-logs/stats:
 *   get:
 *     summary: GET /stats
 *     tags: [AuditLog]
 *     responses:
 *       200:
 *         description: Successful operation
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.get('/stats', getAuditStats);

/**
 * @swagger
 * /api/audit-logs/{id}:
 *   get:
 *     summary: Get audit log by ID
 *     tags: [Audit Logs]
 */
/**
 * @swagger
 * /api/audit-logs/{id}:
 *   get:
 *     summary: GET /:id
 *     tags: [AuditLog]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successful operation
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.get('/:id', getAuditLogById);

export default router;
