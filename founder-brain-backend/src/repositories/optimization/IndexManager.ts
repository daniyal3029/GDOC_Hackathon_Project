import { Meeting } from '../../models/Meeting';
import { Task } from '../../models/Task';
import { Notification } from '../../models/Notification';
import { ILogger } from '../../interfaces/ILogger';

export class IndexManager {
  constructor(private logger: ILogger) {}

  async ensureIndexes(): Promise<void> {
    try {
      this.logger.info('Ensuring database indexes...');

      // 1. Meeting Indexes
      await Meeting.collection.createIndex({ createdAt: -1 });
      await Meeting.collection.createIndex({ processingStatus: 1, createdAt: -1 });
      await Meeting.collection.createIndex({ embeddingStatus: 1 });

      // 2. Task Indexes
      await Task.collection.createIndex({ status: 1, owner: 1 });
      await Task.collection.createIndex({ meetingId: 1 });
      await Task.collection.createIndex({ deadline: 1 });
      await Task.collection.createIndex({ status: 1, deadline: 1 });
      await Task.collection.createIndex({ version: 1 });

      // 3. Notification Indexes
      await Notification.collection.createIndex({ userId: 1, createdAt: -1 });
      await Notification.collection.createIndex({ userId: 1, read: 1 });

      this.logger.info('Database indexes verified successfully.');
    } catch (error) {
      this.logger.error('Failed to ensure database indexes', { error });
    }
  }
}
