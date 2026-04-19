import express from 'express';
import { globalSearch } from '../controllers/searchController.js';

const router = express.Router();

/**
 * @swagger
 * /api/search:
 *   get:
 *     summary: GET /
 *     tags: [Search]
 *     responses:
 *       200:
 *         description: Successful operation
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.get('/', globalSearch);

export default router;
