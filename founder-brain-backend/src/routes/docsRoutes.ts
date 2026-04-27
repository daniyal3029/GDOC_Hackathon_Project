import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from '../docs/swagger';
import config from '../config/environment';

const router = Router();

const swaggerOptions = {
  explorer: true,
  customSiteTitle: 'Founder Brain API Documentation',
  swaggerOptions: {
    persistAuthorization: true,
    displayOperationId: true,
    defaultModelsExpandDepth: 1,
    defaultModelExpandDepth: 1,
    docExpansion: 'list' as const,
    filter: true,
    showExtensions: true,
    tryItOutEnabled: true,
  },
};

/**
 * @route GET /api-docs.json
 * @desc Get the OpenAPI specification in JSON format
 */
router.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Serve Swagger UI
if (config.SWAGGER_ENABLED) {
  router.use('/', swaggerUi.serve);
  router.get('/', swaggerUi.setup(swaggerSpec, swaggerOptions));
}

export default router;
