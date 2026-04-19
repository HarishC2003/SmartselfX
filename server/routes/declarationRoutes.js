import express from 'express';
import {
    addDeclaration,
    getMyDeclarations,
    updateDeclaration,
    updateQtyOnly,
    deleteDeclaration,
    getAssignedProducts,
    searchVendorsForProduct,
    getAllDeclarations,
    rejectAssignment
} from '../controllers/declarationController.js';
import { requireRole } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Base mounted under /api/declarations with verifyToken

// ADMIN, MANAGER Routes
router.get('/search', requireRole('ADMIN', 'MANAGER'), searchVendorsForProduct);
router.get('/', requireRole('ADMIN', 'MANAGER'), getAllDeclarations);

// VENDOR Routes
router.get('/mine', requireRole('VENDOR'), getMyDeclarations);
router.get('/assigned', requireRole('VENDOR'), getAssignedProducts);
router.post('/', requireRole('VENDOR'), addDeclaration);
router.put('/:id', requireRole('VENDOR'), updateDeclaration);
router.patch('/:id/qty', requireRole('VENDOR'), updateQtyOnly);
router.delete('/:id', requireRole('VENDOR'), deleteDeclaration);
router.post('/reject-assignment', requireRole('VENDOR'), rejectAssignment);

export default router;
