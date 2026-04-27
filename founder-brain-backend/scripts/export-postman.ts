import fs from 'fs';
import path from 'path';
import { swaggerSpec } from '../src/docs/swagger';

/**
 * Very basic converter from OpenAPI to Postman-like structure.
 */
const exportPostman = () => {
  const spec = swaggerSpec as any;
  const postman = {
    info: {
      name: 'Founder Brain API',
      description: 'AI-powered meeting intelligence and task management.',
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    },
    item: Object.entries(spec.paths || {}).map(([path, methods]: [string, any]) => ({
      name: path,
      item: Object.entries(methods).map(([method, details]: [string, any]) => ({
        name: details.summary || path,
        request: {
          method: method.toUpperCase(),
          header: [
            { key: 'Idempotency-Key', value: '{{idempotency_key}}', type: 'text' },
            { key: 'Authorization', value: 'Bearer {{token}}', type: 'text' },
          ],
          url: {
            raw: `{{base_url}}${path}`,
            host: ['{{base_url}}'],
            path: path.split('/').filter(p => p),
          },
          description: details.description || '',
        },
      })),
    })),
    variable: [
      { key: 'base_url', value: 'http://localhost:3000', type: 'string' },
      { key: 'idempotency_key', value: 'unique-key-123', type: 'string' },
      { key: 'token', value: 'your-jwt-token', type: 'string' },
    ],
  };

  const outputDir = path.join(__dirname, '../postman');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  const outputPath = path.join(outputDir, 'FounderBrain.postman_collection.json');
  fs.writeFileSync(outputPath, JSON.stringify(postman, null, 2));
  console.log(`✅ Postman collection exported to ${outputPath}`);
};

exportPostman();
