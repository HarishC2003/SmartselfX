import express from 'express';
import {
    getAlerts,
    markAlertRead,
    markAllAlertsRead,
    dismissAlert,
    getAlertCount
} from '../controllers/alertController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { adminOrManager, allRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(verifyToken);

router.get('/count', allRoles, getAlertCount);
router.get('/', allRoles, getAlerts);
router.patch('/read-all', adminOrManager, markAllAlertsRead);
router.patch('/:id/read', adminOrManager, markAlertRead);
router.patch('/:id/dismiss', adminOrManager, dismissAlert);

export default router;
