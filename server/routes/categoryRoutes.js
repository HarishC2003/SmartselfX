import express from 'express';
import {
    createCategory,
    getAllCategories,
    updateCategory,
    deleteCategory
} from '../controllers/categoryController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { adminOnly, allRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(verifyToken);

router.get('/', allRoles, getAllCategories);
router.post('/', adminOnly, createCategory);
router.put('/:id', adminOnly, updateCategory);
router.delete('/:id', adminOnly, deleteCategory);

export default router;
