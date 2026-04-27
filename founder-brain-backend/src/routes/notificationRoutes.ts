import { Router } from 'express';
import { container } from '../config/container';
import { authenticate } from '../middleware/auth';

const router = Router();
const controller = container.resolve<any>('NotificationController');

router.get('/', authenticate, (req, res, next) => controller.getNotifications(req, res, next));
router.get('/unread/count', authenticate, (req, res, next) => controller.getUnreadCount(req, res, next));
router.patch('/:id/read', authenticate, (req, res, next) => controller.markAsRead(req, res, next));
router.patch('/read-all', authenticate, (req, res, next) => controller.markAllAsRead(req, res, next));

export default router;
