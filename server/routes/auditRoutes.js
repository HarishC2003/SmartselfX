import express from 'express';
import { getAuditLogs, getUserActivity, getAuditStats } from '../controllers/auditController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { adminOnly } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(verifyToken);
router.use(adminOnly);

router.get('/', getAuditLogs);
router.get('/stats', getAuditStats);
router.get('/user/:userId', getUserActivity);

export default router;
