import express from 'express';
import {
    getProductForecast,
    refreshForecast,
    getAllForecasts,
    getForecastSummary
} from '../controllers/forecastController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { adminOrManager } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(verifyToken);

router.get('/summary', adminOrManager, getForecastSummary);
router.get('/', adminOrManager, getAllForecasts);
router.get('/:productId', adminOrManager, getProductForecast);
router.post('/:productId/refresh', adminOrManager, refreshForecast);

export default router;
