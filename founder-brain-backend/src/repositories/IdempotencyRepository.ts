import { IdempotencyRecord, IIdempotencyRecord } from '../models/IdempotencyRecord';
import { IdempotencyStatus } from '../types/idempotency.types';

export class IdempotencyRepository {
  async findByKey(key: string): Promise<IIdempotencyRecord | null> {
    return await IdempotencyRecord.findById(key);
  }

  async create(data: {
    key: string;
    status: IdempotencyStatus;
    request: any;
    expiresAt: Date;
  }): Promise<IIdempotencyRecord> {
    return await IdempotencyRecord.create({
      _id: data.key,
      ...data
    });
  }

  async updateStatus(key: string, status: IdempotencyStatus, updates: Partial<IIdempotencyRecord> = {}): Promise<IIdempotencyRecord | null> {
    return await IdempotencyRecord.findByIdAndUpdate(
      key,
      { $set: { status, ...updates }, $inc: { retryCount: 1 } },
      { new: true, writeConcern: { w: 'majority' } }
    );
  }

  async deleteExpired(): Promise<number> {
    const result = await IdempotencyRecord.deleteMany({
      expiresAt: { $lt: new Date() }
    });
    return result.deletedCount;
  }

  async getStats() {
    const stats = await IdempotencyRecord.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    return stats.reduce((acc: any, curr: any) => {
      acc[curr._id] = curr.count;
      return acc;
    }, { processing: 0, completed: 0, failed: 0 });
  }
}
