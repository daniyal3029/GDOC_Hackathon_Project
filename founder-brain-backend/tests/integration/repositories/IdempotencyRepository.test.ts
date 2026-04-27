import { IdempotencyRepository } from '../../../src/repositories/IdempotencyRepository';

describe('IdempotencyRepository Integration Tests', () => {
  let repo: IdempotencyRepository;

  beforeEach(() => {
    repo = new IdempotencyRepository();
  });

  it('should create and find a record', async () => {
    const key = 'test-key-' + Math.random().toString(36).substring(7);
    await repo.create({
      key,
      status: 'processing',
      request: { method: 'POST', path: '/api/test', body: {}, headers: {} },
      expiresAt: new Date(Date.now() + 3600000)
    });

    const record = await repo.findByKey(key);
    expect(record).toBeDefined();
    expect(record?.status).toBe('processing');
  });

  it('should update status', async () => {
    const key = 'update-key-' + Math.random().toString(36).substring(7);
    await repo.create({
      key,
      status: 'processing',
      request: { method: 'POST', path: '/api/test', body: {}, headers: {} },
      expiresAt: new Date(Date.now() + 3600000)
    });

    await repo.updateStatus(key, 'completed', { response: { body: 'done', statusCode: 200, headers: {} } });
    const record = await repo.findByKey(key);
    expect(record?.status).toBe('completed');
    expect(record?.response?.body).toBe('done');
  });
});
