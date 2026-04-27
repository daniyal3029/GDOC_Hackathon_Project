import request from 'supertest';
import app from '../../../src/app';
import mongoose from 'mongoose';
import { redisClient } from '../../../src/config/redis';

// Mock meeting queue
jest.mock('../../../src/queues/meetingQueue', () => ({
  addMeetingJob: jest.fn().mockResolvedValue({ id: 'job-123' }),
  getJobStatus: jest.fn(),
}));

describe('Meeting API Integration Tests', () => {
  describe('POST /api/meetings/process', () => {
    it('should return 202 and jobId for valid input', async () => {
      const response = await request(app)
        .post('/api/meetings/process')
        .set('Idempotency-Key', 'unique-key-1')
        .send({ text: 'Valid meeting notes content for testing purposes.' });

      expect(response.status).toBe(202);
      expect(response.body).toHaveProperty('jobId');
      expect(response.body).toHaveProperty('meetingId');
    });

    it('should return 400 for empty text', async () => {
      const response = await request(app)
        .post('/api/meetings/process')
        .send({ text: '' });

      expect(response.status).toBe(400);
    });

    it('should return cached response for duplicate idempotency key', async () => {
      const payload = { text: 'Testing idempotency.' };
      const key = 'idem-test-123';

      const res1 = await request(app)
        .post('/api/meetings/process')
        .set('Idempotency-Key', key)
        .send(payload);

      const res2 = await request(app)
        .post('/api/meetings/process')
        .set('Idempotency-Key', key)
        .send(payload);

      expect(res1.status).toBe(202);
      expect(res2.status).toBe(202);
      expect(res2.header['idempotency-replayed']).toBe('true');
      expect(res2.body.jobId).toBe(res1.body.jobId);
    });
  });

  describe('GET /api/meetings', () => {
    it('should return paginated list of meetings', async () => {
      const response = await request(app).get('/api/meetings');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
});
