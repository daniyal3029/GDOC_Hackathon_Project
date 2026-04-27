import { Server as HttpServer } from 'http';
import logger from './logger';
import { redisClient } from './redis';

// Repositories
import { MeetingRepository } from '../repositories/MeetingRepository';
import { TaskRepository } from '../repositories/TaskRepository';
import { VectorRepository } from '../repositories/VectorRepository';
import { NotificationRepository } from '../repositories/NotificationRepository';
import { IdempotencyRepository } from '../repositories/IdempotencyRepository';
import { UserRepository } from '../repositories/UserRepository';

// Services
import { MeetingService } from '../services/MeetingService';
import { TaskService } from '../services/TaskService';
import { AIService } from '../services/AIService';
import { VectorService } from '../services/VectorService';
import { EmbeddingService } from '../services/EmbeddingService';
import { QueryService } from '../services/QueryService';
import { PresenceService } from '../services/PresenceService';
import { NotificationService } from '../services/NotificationService';
import { StreamingQueryService } from '../services/StreamingQueryService';
import { CacheService } from '../services/CacheService';
import { CacheInvalidationService } from '../services/CacheInvalidationService';
import { IdempotencyService } from '../services/IdempotencyService';
import { AuthService } from '../services/AuthService';
import { TokenService } from '../services/TokenService';
import { UserService } from '../services/UserService';
import { EmailService } from '../services/EmailService';
import { OTPService } from '../services/OTPService';
import { CloudinaryService } from '../services/CloudinaryService';
import { RateLimitMonitoringService } from '../services/RateLimitMonitoringService';
import { SocketServer } from '../socket/SocketServer';

// Controllers
import { MeetingController } from '../controllers/MeetingController';
import { TaskController } from '../controllers/TaskController';
import { QueryController } from '../controllers/QueryController';
import { NotificationController } from '../controllers/NotificationController';
import { AuthController } from '../controllers/AuthController';

// Others
import { MeetingWorker } from '../workers/MeetingWorker';
import { EmbeddingServiceFactory } from '../factories/EmbeddingServiceFactory';
import { IndexManager } from '../repositories/optimization/IndexManager';

/**
 * Dependency Injection Container.
 * Resolves and provides service instances.
 */
class Container {
  private static instance: Container;
  private services: Map<string, any> = new Map();

  private constructor() {
    this.initialize();
  }

  static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  /**
   * Initializes all services. Order matters for dependencies.
   */
  private initialize(): void {
    try {
      logger.info('Initializing Dependency Injection Container...');

      // 1. Core utilities
      this.services.set('Logger', logger);
      this.services.set('Redis', redisClient);

      // 2. Repositories
      const meetingRepository = new MeetingRepository();
      const taskRepository = new TaskRepository();
      const vectorRepository = new VectorRepository();
      const notificationRepository = new NotificationRepository();
      const idempotencyRepository = new IdempotencyRepository();
      const userRepository = new UserRepository();

      this.services.set('MeetingRepository', meetingRepository);
      this.services.set('TaskRepository', taskRepository);
      this.services.set('VectorRepository', vectorRepository);
      this.services.set('NotificationRepository', notificationRepository);
      this.services.set('IdempotencyRepository', idempotencyRepository);
      this.services.set('UserRepository', userRepository);

      // 3. Independent & Infrastructure Services
      const cacheService = new CacheService(redisClient, logger);
      const cacheInvalidationService = new CacheInvalidationService(cacheService, logger);
      const idempotencyService = new IdempotencyService(idempotencyRepository, cacheService, logger);
      const rateLimitMonitoringService = new RateLimitMonitoringService(logger);
      const indexManager = new IndexManager(logger);
      const aiService = new AIService(logger);
      const embeddingService = EmbeddingServiceFactory.create(logger);
      const presenceService = new PresenceService(redisClient, logger);
      const tokenService = new TokenService();
      const userService = new UserService(userRepository);
      const emailService = new EmailService(logger);
      const otpService = new OTPService(redisClient, logger);
      const cloudinaryService = new CloudinaryService(logger);
      const authService = new AuthService(userRepository, tokenService, logger, otpService, emailService);
      
      // Socket Server (Ready for late attachment)
      const socketServer = new SocketServer(logger, presenceService);

      this.services.set('CacheService', cacheService);
      this.services.set('CacheInvalidationService', cacheInvalidationService);
      this.services.set('IdempotencyService', idempotencyService);
      this.services.set('RateLimitMonitoringService', rateLimitMonitoringService);
      this.services.set('IndexManager', indexManager);
      this.services.set('AIService', aiService);
      this.services.set('EmbeddingService', embeddingService);
      this.services.set('PresenceService', presenceService);
      this.services.set('TokenService', tokenService);
      this.services.set('UserService', userService);
      this.services.set('AuthService', authService);
      this.services.set('EmailService', emailService);
      this.services.set('OTPService', otpService);
      this.services.set('CloudinaryService', cloudinaryService);
      this.services.set('SocketServer', socketServer);

      // 4. Dependent Services
      const vectorService = new VectorService(embeddingService, vectorRepository, logger);
      const queryService = new QueryService(vectorService, cacheService, logger);
      const streamingQueryService = new StreamingQueryService(vectorService, logger);
      const notificationService = new NotificationService(notificationRepository, socketServer, logger);
      const meetingService = new MeetingService(meetingRepository, socketServer, cacheInvalidationService, logger);
      const taskService = new TaskService(taskRepository, notificationRepository, socketServer, cacheInvalidationService, logger);

      this.services.set('VectorService', vectorService);
      this.services.set('QueryService', queryService);
      this.services.set('StreamingQueryService', streamingQueryService);
      this.services.set('NotificationService', notificationService);
      this.services.set('MeetingService', meetingService);
      this.services.set('TaskService', taskService);

      // 5. Workers
      const meetingWorker = new MeetingWorker(aiService, meetingRepository, taskRepository, socketServer, logger);
      this.services.set('MeetingWorker', meetingWorker);

      // 6. Controllers
      const meetingController = new MeetingController(meetingService, logger, idempotencyService);
      const taskController = new TaskController(taskService, logger, idempotencyService);
      const queryController = new QueryController(queryService, logger);
      const notificationController = new NotificationController(notificationService);
      const authController = new AuthController(authService, userService);

      this.services.set('MeetingController', meetingController);
      this.services.set('TaskController', taskController);
      this.services.set('QueryController', queryController);
      this.services.set('NotificationController', notificationController);
      this.services.set('AuthController', authController);

      logger.info('Dependency Injection Container initialized successfully.');
    } catch (error) {
      logger.error('Failed to initialize DI Container', { error });
      throw error;
    }
  }

  /**
   * Finalizes socket attachment after server start.
   */
  public attachSocketServer(httpServer: HttpServer): void {
    const socketServer: SocketServer = this.resolve('SocketServer');
    socketServer.attach(httpServer);
  }

  /**
   * Generic resolution.
   */
  resolve<T>(key: string): T {
    const service = this.services.get(key);
    if (!service) {
      throw new Error(`Service ${key} not found in container.`);
    }
    return service;
  }

  // Typed Getters
  getMeetingController(): MeetingController { return this.resolve('MeetingController'); }
  getTaskController(): TaskController { return this.resolve('TaskController'); }
  getQueryController(): QueryController { return this.resolve('QueryController'); }
  getNotificationController(): NotificationController { return this.resolve('NotificationController'); }
  getCacheService(): CacheService { return this.resolve('CacheService'); }
  getCacheInvalidationService(): CacheInvalidationService { return this.resolve('CacheInvalidationService'); }
  getIndexManager(): IndexManager { return this.resolve('IndexManager'); }
  getIdempotencyService(): IdempotencyService { return this.resolve('IdempotencyService'); }
  
  getMeetingService(): MeetingService { return this.resolve('MeetingService'); }
  getTaskService(): TaskService { return this.resolve('TaskService'); }
  getQueryService(): QueryService { return this.resolve('QueryService'); }
  getMeetingWorker(): MeetingWorker { return this.resolve('MeetingWorker'); }
  getSocketServer(): SocketServer { return this.resolve('SocketServer'); }

  getAuthService(): AuthService { return this.resolve('AuthService'); }
  getTokenService(): TokenService { return this.resolve('TokenService'); }
  getUserService(): UserService { return this.resolve('UserService'); }
  getAuthController(): AuthController { return this.resolve('AuthController'); }
  getOTPService(): OTPService { return this.resolve('OTPService'); }
  getEmailService(): EmailService { return this.resolve('EmailService'); }
  getCloudinaryService(): CloudinaryService { return this.resolve('CloudinaryService'); }
}

export const container = Container.getInstance();
export const getContainer = () => Container.getInstance();
