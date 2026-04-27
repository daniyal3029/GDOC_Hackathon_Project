import swaggerJSDoc from 'swagger-jsdoc';
import config from '../config/environment';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: config.API_TITLE,
      version: config.API_VERSION,
      description: config.API_DESCRIPTION,
      contact: {
        name: 'API Support',
        url: 'https://example.com/support',
        email: 'support@example.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: config.API_SERVER_URL,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        IdempotencyKey: {
          type: 'apiKey',
          in: 'header',
          name: 'Idempotency-Key',
          description: 'Unique key to ensure idempotent requests',
        },
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string', example: 'Not Found' },
            message: { type: 'string', example: 'Resource not found' },
            statusCode: { type: 'number', example: 404 },
            timestamp: { type: 'string', format: 'date-time' },
            traceId: { type: 'string' },
            path: { type: 'string' },
          },
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            data: { type: 'array', items: { type: 'object' } },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'number' },
                limit: { type: 'number' },
                total: { type: 'number' },
                totalPages: { type: 'number' },
                hasNext: { type: 'boolean' },
                hasPrev: { type: 'boolean' },
              },
            },
          },
        },
      },
    },
    tags: [
      { name: 'Meetings', description: 'Meeting processing and retrieval' },
      { name: 'Tasks', description: 'Task management and updates' },
      { name: 'Query', description: 'AI-powered semantic search' },
      { name: 'Notifications', description: 'User notifications' },
      { name: 'Monitoring', description: 'Health and performance monitoring' },
    ],
  },
  apis: ['./src/routes/*.ts', './src/models/*.ts'], // Path to the API docs
};

export const swaggerSpec = swaggerJSDoc(options);
