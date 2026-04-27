import { Router } from 'express';
import { container } from '../config/container';
import { validateObjectId } from '../middleware/validation';
import paginationMiddleware from '../middleware/pagination';
import { taskCompleteLimiter, readEndpointsLimiter } from '../middleware/rateLimiter/endpointRateLimit';

const router = Router();
const taskController = container.getTaskController();

/**
 * @openapi
 * /api/tasks:
 *   get:
 *     tags: [Tasks]
 *     summary: Get all tasks with filters and pagination
 *     parameters:
 *       - in: query
 *         name: owner
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, completed] }
 *     responses:
 *       200:
 *         description: Success
 */
router.get(
  '/',
  readEndpointsLimiter,
  paginationMiddleware,
  taskController.getTasks.bind(taskController)
);

/**
 * @openapi
 * /api/tasks/pending/grouped:
 *   get:
 *     tags: [Tasks]
 *     summary: Get pending tasks grouped by owner
 *     responses:
 *       200:
 *         description: Success
 */
router.get(
  '/pending/grouped',
  readEndpointsLimiter,
  taskController.getPendingGrouped.bind(taskController)
);

/**
 * @openapi
 * /api/tasks/{id}:
 *   get:
 *     tags: [Tasks]
 *     summary: Get a single task by ID
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
  '/:id',
  readEndpointsLimiter,
  validateObjectId('id'),
  taskController.getTaskById.bind(taskController)
);

/**
 * @openapi
 * /api/tasks/{id}:
 *   patch:
 *     tags: [Tasks]
 *     summary: Update task fields
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               description: { type: string }
 *               owner: { type: string }
 *               deadline: { type: string, format: date }
 *               version: { type: integer, required: true }
 *     responses:
 *       200:
 *         description: Success
 *       409:
 *         description: Conflict (Optimistic Lock failure)
 */
router.patch(
  '/:id',
  taskCompleteLimiter,
  validateObjectId('id'),
  taskController.updateTask.bind(taskController)
);

/**
 * @openapi
 * /api/tasks/{id}/complete:
 *   post:
 *     tags: [Tasks]
 *     summary: Mark a task as completed
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [version]
 *             properties:
 *               version: { type: integer }
 *     responses:
 *       200:
 *         description: Success
 *       409:
 *         description: Conflict
 */
router.post(
  '/:id/complete',
  taskCompleteLimiter,
  validateObjectId('id'),
  taskController.completeTask.bind(taskController)
);

export default router;
