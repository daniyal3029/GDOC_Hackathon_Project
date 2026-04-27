import { Redis } from 'ioredis';
import { IPresenceService } from '../interfaces/IPresenceService';
import { ILogger } from '../interfaces/ILogger';

export class PresenceService implements IPresenceService {
  private redis: Redis;
  private logger: ILogger;
  private readonly TTL = 60; // 60 seconds

  constructor(redis: Redis, logger: ILogger) {
    this.redis = redis;
    this.logger = logger;
  }

  async userJoinRoom(userId: string, socketId: string, roomId: string): Promise<void> {
    const multi = this.redis.multi();
    
    // Room -> Users mapping
    multi.sadd(`presence:room:${roomId}`, userId);
    
    // User -> Rooms mapping
    multi.sadd(`presence:user:${userId}`, roomId);
    
    // Socket -> User mapping
    multi.set(`presence:socket:${socketId}`, userId, 'EX', this.TTL);

    await multi.exec();
    this.logger.debug('User joined room', { userId, roomId, socketId });
  }

  async userLeaveRoom(userId: string, socketId: string, roomId: string): Promise<void> {
    const multi = this.redis.multi();
    
    multi.srem(`presence:room:${roomId}`, userId);
    multi.srem(`presence:user:${userId}`, roomId);
    
    await multi.exec();
    this.logger.debug('User left room', { userId, roomId, socketId });
  }

  async getUsersInRoom(roomId: string): Promise<string[]> {
    return await this.redis.smembers(`presence:room:${roomId}`);
  }

  async getUserRooms(userId: string): Promise<string[]> {
    return await this.redis.smembers(`presence:user:${userId}`);
  }

  async disconnectUser(userId: string, socketId: string): Promise<void> {
    // Find rooms user was in
    const rooms = await this.getUserRooms(userId);
    
    const multi = this.redis.multi();
    for (const roomId of rooms) {
      multi.srem(`presence:room:${roomId}`, userId);
    }
    multi.del(`presence:user:${userId}`);
    multi.del(`presence:socket:${socketId}`);
    
    await multi.exec();
    this.logger.debug('User disconnected, cleared presence', { userId, socketId });
  }

  async heartbeat(userId: string, socketId: string): Promise<void> {
    // Renew socket TTL
    await this.redis.expire(`presence:socket:${socketId}`, this.TTL);
  }
}
