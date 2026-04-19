import express from 'express';
import { body, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import {
    register,
    login,
    verifyEmail,
    refreshToken,
    logout,
    forgotPassword,
    resetPassword
} from '../controllers/authController.js';

const router = express.Router();

// Rate limiting for login
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100000, // Limit each IP to 10000 requests per windowMs (effectively disabled for dev)
    message: { message: 'Too many login attempts from this IP, please try again after 15 minutes' }
});

// Validation middleware
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

const registerValidation = [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
    body('role').optional().isIn(['ADMIN', 'MANAGER', 'VENDOR']).withMessage('Invalid role'),
    validate,
];

const loginValidation = [
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
    validate,
];

const resetPasswordValidation = [
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
    validate,
];

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: POST /register
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Successful operation
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post('/register', registerValidation, register);
/**
 * @swagger
 * /api/auth/verify-email/{token}:
 *   get:
 *     summary: GET /verify-email/:token
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: token
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
router.get('/verify-email/:token', verifyEmail);
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: POST /login
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Successful operation
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post('/login', loginLimiter, loginValidation, login);
/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: POST /refresh
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Successful operation
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post('/refresh', refreshToken);
/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: POST /logout
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Successful operation
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post('/logout', logout);
/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: POST /forgot-password
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Successful operation
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post('/forgot-password', body('email').isEmail(), validate, forgotPassword);
/**
 * @swagger
 * /api/auth/reset-password/{token}:
 *   post:
 *     summary: POST /reset-password/:token
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: token
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
router.post('/reset-password/:token', resetPasswordValidation, resetPassword);

export default router;
