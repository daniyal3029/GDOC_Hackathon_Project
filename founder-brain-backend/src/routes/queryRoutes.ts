import { Router } from 'express';
import { container } from '../config/container';
import { queryLimiter } from '../middleware/rateLimiter/endpointRateLimit';
import { authenticate } from '../middleware/auth';

const router = Router();
const queryController = container.getQueryController();

router.post('/', authenticate, queryLimiter, queryController.askQuestion.bind(queryController));
router.get('/suggestions', authenticate, queryLimiter, queryController.getSuggestions.bind(queryController));

export default router;
