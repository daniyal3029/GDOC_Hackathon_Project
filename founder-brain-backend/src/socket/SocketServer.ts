import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { ISocketServer } from '../interfaces/ISocketServer';
import { ILogger } from '../interfaces/ILogger';
import { IPresenceService } from '../interfaces/IPresenceService';
import { socketAuth } from '../middleware/socketAuth';
import { SocketEvents } from './SocketEvents';
import { registerMeetingHandlers } from './handlers/meetingHandlers';
import { registerTaskHandlers } from './handlers/taskHandlers';
import { registerQueryHandlers } from './handlers/queryHandlers';
import { registerPresenceHandlers } from './handlers/presenceHandlers';
import { registerNotificationHandlers } from './handlers/notificationHandlers';
import { checkConnectionRateLimit, checkSocketRateLimit } from './rateLimitSocket';
import config from '../config/environment';

export class SocketServer implements ISocketServer {
  private io: Server;
  private logger: ILogger;
  private presenceService: IPresenceService;
  private isAttached: boolean = false;

  constructor(logger: ILogger, presenceService: IPresenceService) {
    this.logger = logger;
    this.presenceService = presenceService;

    // Initialize without server first to support DI registration before server start
    this.io = new Server({
      cors: {
        origin: config.CORS_ORIGIN || '*',
        methods: ['GET', 'POST'],
        credentials: true
      },
      pingTimeout: 60000,
      pingInterval: 25000,
      transports: ['websocket', 'polling'],
      path: config.SOCKET_PATH || '/socket.io'
    });

    this.initialize();
  }

  /**
   * Attaches the socket server to an HTTP server.
   */
  public attach(server: HttpServer): void {
    if (this.isAttached) return;
    this.io.attach(server);
    this.isAttached = true;
    this.logger.info('Socket.io Server attached to HTTP server.');
  }

  private initialize(): void {
    this.logger.info('Initializing Socket.io Server logic...');

    // Apply Connection Rate Limiting Middleware
    this.io.use(async (socket: Socket, next) => {
      const ip = socket.handshake.address;
      const isAllowed = await checkConnectionRateLimit(ip);
      if (!isAllowed) {
        return next(new Error('Connection rate limit exceeded'));
      }
      next();
    });

    // Apply Auth Middleware
    this.io.use(socketAuth(this.logger));

    this.io.on(SocketEvents.CONNECT, (socket: Socket) => {
      const userId = socket.data.userId;
      this.logger.info('New socket connection', { userId, socketId: socket.id });

      // Apply Message Rate Limiting
      socket.use(async (packet, next) => {
        const isAllowed = await checkSocketRateLimit(socket.id);
        if (!isAllowed) {
          socket.emit('rate_limit_exceeded', { error: 'Too many messages' });
          socket.disconnect(true);
          return next(new Error('Message rate limit exceeded'));
        }
        next();
      });

      // Joins user to their private room for direct notifications
      socket.join(`user:${userId}`);

      // Register Handlers
      registerMeetingHandlers(this.io, socket, this.logger);
      registerTaskHandlers(this.io, socket, this.logger);
      registerQueryHandlers(this.io, socket, this.logger);
      registerPresenceHandlers(this.io, socket, this.logger, this.presenceService);
      registerNotificationHandlers(this.io, socket, this.logger);

      socket.on(SocketEvents.DISCONNECT, async (reason) => {
        this.logger.info('Socket disconnected', { userId, socketId: socket.id, reason });
        await this.presenceService.disconnectUser(userId, socket.id);
      });

      socket.on(SocketEvents.ERROR, (error) => {
        this.logger.error('Socket error', { userId, socketId: socket.id, error });
      });
    });
  }

  emitToUser(userId: string, event: string, data: any): void {
    this.io.to(`user:${userId}`).emit(event, data);
  }

  emitToRoom(roomId: string, event: string, data: any): void {
    this.io.to(roomId).emit(event, data);
  }

  getIO(): Server {
    return this.io;
  }
}
