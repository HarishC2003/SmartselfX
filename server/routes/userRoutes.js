import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import { adminOnly } from '../middleware/roleMiddleware.js';
import {
    getUsers,
    updateUserRole,
    updateUserStatus,
    deleteUser,
    inviteUser
} from '../controllers/userController.js';

const router = express.Router();

router.use(verifyToken);
router.use(adminOnly); // ALL user routes are admin only based on Fix 2 instructions

/**
 * @swagger
 * /api/users:
 *   get: ...
 */
router.get('/', getUsers);
router.post('/invite', inviteUser);
router.put('/:id/role', updateUserRole);
router.put('/:id/status', updateUserStatus);
router.delete('/:id', deleteUser);

export default router;
