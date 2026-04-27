import { Router } from 'express';
import { container } from '../config/container';

const router = Router();
const controller = container.resolve<any>('NotificationController');

/**
 * @openapi
 * /api/notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: List notifications for the user
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/', (req, res, next) => controller.getNotifications(req, res, next));

/**
 * @openapi
 * /api/notifications/unread/count:
 *   get:
 *     tags: [Notifications]
 *     summary: Get unread notification count
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/unread/count', (req, res, next) => controller.getUnreadCount(req, res, next));

/**
 * @openapi
 * /api/notifications/{id}/read:
 *   patch:
 *     tags: [Notifications]
 *     summary: Mark a notification as read
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Success
 */
router.patch('/:id/read', (req, res, next) => controller.markAsRead(req, res, next));

/**
 * @openapi
 * /api/notifications/read-all:
 *   patch:
 *     tags: [Notifications]
 *     summary: Mark all notifications as read
 *     responses:
 *       200:
 *         description: Success
 */
router.patch('/read-all', (req, res, next) => controller.markAllAsRead(req, res, next));

export default router;
