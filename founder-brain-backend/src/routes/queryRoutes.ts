import { Router } from 'express';
import { container } from '../config/container';
import { queryLimiter } from '../middleware/rateLimiter/endpointRateLimit';

const router = Router();
const queryController = container.getQueryController();

/**
 * @openapi
 * /api/query:
 *   post:
 *     tags: [Query]
 *     summary: Ask a natural language question about meetings
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [question]
 *             properties:
 *               question: { type: string, example: "What did we decide about the marketing budget?" }
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 answer: { type: string }
 *                 sources:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       meetingId: { type: string }
 *                       excerpt: { type: string }
 */
router.post('/', queryLimiter, queryController.askQuestion.bind(queryController));

/**
 * @openapi
 * /api/query/suggestions:
 *   get:
 *     tags: [Query]
 *     summary: Get suggested questions
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/suggestions', queryLimiter, queryController.getSuggestions.bind(queryController));

export default router;
