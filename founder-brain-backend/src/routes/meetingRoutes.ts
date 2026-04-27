import { Router } from 'express';
import { container } from '../config/container';
import { validateObjectId } from '../middleware/validation';
import paginationMiddleware from '../middleware/pagination';
import { meetingProcessLimiter, readEndpointsLimiter } from '../middleware/rateLimiter/endpointRateLimit';

const router = Router();
const meetingController = container.getMeetingController();

/**
 * @openapi
 * /api/meetings:
 *   get:
 *     tags: [Meetings]
 *     summary: List all meetings with pagination
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/PaginatedResponse' }
 */
router.get(
  '/',
  readEndpointsLimiter,
  paginationMiddleware,
  meetingController.getMeetings.bind(meetingController)
);

/**
 * @openapi
 * /api/meetings/stats:
 *   get:
 *     tags: [Meetings]
 *     summary: Get meeting statistics
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalMeetings: { type: number }
 *                 completedMeetings: { type: number }
 *                 failedMeetings: { type: number }
 */
router.get(
  '/stats',
  readEndpointsLimiter,
  meetingController.getMeetingStats.bind(meetingController)
);

/**
 * @openapi
 * /api/meetings/process:
 *   post:
 *     tags: [Meetings]
 *     summary: Queue a meeting for AI processing
 *     security:
 *       - IdempotencyKey: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [text]
 *             properties:
 *               text: { type: string, example: "Meeting notes content..." }
 *     responses:
 *       202:
 *         description: Accepted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 jobId: { type: string }
 *                 meetingId: { type: string }
 */
router.post(
  '/process',
  meetingProcessLimiter,
  meetingController.processMeeting.bind(meetingController)
);

/**
 * @openapi
 * /api/meetings/{id}/status:
 *   get:
 *     tags: [Meetings]
 *     summary: Check processing status
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, enum: [pending, processing, completed, failed] }
 *                 progress: { type: number, example: 50 }
 */
router.get(
  '/:id/status',
  readEndpointsLimiter,
  validateObjectId('id'),
  meetingController.getMeetingStatus.bind(meetingController)
);

/**
 * @openapi
 * /api/meetings/{id}/progress:
 *   get:
 *     tags: [Meetings]
 *     summary: Get meeting details with task completion progress
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Success
 */
router.get(
  '/:id/progress',
  readEndpointsLimiter,
  validateObjectId('id'),
  meetingController.getMeetingWithProgress.bind(meetingController)
);

/**
 * @openapi
 * /api/meetings/{id}:
 *   get:
 *     tags: [Meetings]
 *     summary: Get full meeting details
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Success
 *       404:
 *         description: Not Found
 */
router.get(
  '/:id',
  readEndpointsLimiter,
  validateObjectId('id'),
  meetingController.getMeeting.bind(meetingController)
);

export default router;
