import { Router } from 'express';
import { container } from '../config/container';
import { validateObjectId } from '../middleware/validation';
import paginationMiddleware from '../middleware/pagination';
import { meetingProcessLimiter, readEndpointsLimiter } from '../middleware/rateLimiter/endpointRateLimit';
import { authenticate } from '../middleware/auth';
import { checkMeetingOwnership } from '../middleware/ownership';

const router = Router();
const meetingController = container.getMeetingController();

router.get(
  '/',
  authenticate,
  readEndpointsLimiter,
  paginationMiddleware,
  meetingController.getMeetings.bind(meetingController)
);

router.get(
  '/stats',
  authenticate,
  readEndpointsLimiter,
  meetingController.getMeetingStats.bind(meetingController)
);

router.post(
  '/process',
  authenticate,
  meetingProcessLimiter,
  meetingController.processMeeting.bind(meetingController)
);

router.get(
  '/:id/status',
  authenticate,
  validateObjectId('id'),
  checkMeetingOwnership,
  readEndpointsLimiter,
  meetingController.getMeetingStatus.bind(meetingController)
);

router.get(
  '/:id/progress',
  authenticate,
  validateObjectId('id'),
  checkMeetingOwnership,
  readEndpointsLimiter,
  meetingController.getMeetingWithProgress.bind(meetingController)
);

router.get(
  '/:id',
  authenticate,
  validateObjectId('id'),
  checkMeetingOwnership,
  readEndpointsLimiter,
  meetingController.getMeeting.bind(meetingController)
);

export default router;
