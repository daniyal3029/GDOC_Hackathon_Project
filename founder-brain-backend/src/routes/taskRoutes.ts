import { Router } from 'express';
import { container } from '../config/container';
import { validateObjectId } from '../middleware/validation';
import paginationMiddleware from '../middleware/pagination';
import { taskCompleteLimiter, readEndpointsLimiter } from '../middleware/rateLimiter/endpointRateLimit';
import { authenticate } from '../middleware/auth';
import { checkTaskOwnership } from '../middleware/ownership';

const router = Router();
const taskController = container.getTaskController();

router.get(
  '/',
  authenticate,
  readEndpointsLimiter,
  paginationMiddleware,
  taskController.getTasks.bind(taskController)
);

router.get(
  '/pending/grouped',
  authenticate,
  readEndpointsLimiter,
  taskController.getPendingGrouped.bind(taskController)
);

router.get(
  '/:id',
  authenticate,
  validateObjectId('id'),
  checkTaskOwnership,
  readEndpointsLimiter,
  taskController.getTaskById.bind(taskController)
);

router.patch(
  '/:id',
  authenticate,
  validateObjectId('id'),
  checkTaskOwnership,
  taskCompleteLimiter,
  taskController.updateTask.bind(taskController)
);

router.post(
  '/:id/complete',
  authenticate,
  validateObjectId('id'),
  checkTaskOwnership,
  taskCompleteLimiter,
  taskController.completeTask.bind(taskController)
);

export default router;
