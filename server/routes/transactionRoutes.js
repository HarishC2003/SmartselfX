import express from 'express';
import {
    stockIn,
    stockOut,
    getAllTransactions,
    getTransactionById,
    getTransactionSummary,
    getProductTransactionHistory
} from '../controllers/transactionController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { adminOrManager, allRoles } from '../middleware/roleMiddleware.js';
import { validateTransaction } from '../middleware/validationMiddleware.js';

const router = express.Router();

router.get('/summary', adminOrManager, getTransactionSummary);
router.get('/product/:productId', allRoles, getProductTransactionHistory);
router.get('/', adminOrManager, getAllTransactions);
router.post('/stock-in', adminOrManager, validateTransaction, stockIn);
router.post('/stock-out', adminOrManager, validateTransaction, stockOut);
router.get('/:id', adminOrManager, getTransactionById);

export default router;
