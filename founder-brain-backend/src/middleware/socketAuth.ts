import { Socket } from 'socket.io';
import { ILogger } from '../interfaces/ILogger';

/**
 * Socket.io middleware for authentication.
 */
export const socketAuth = (logger: ILogger) => (socket: Socket, next: (err?: Error) => void) => {
  try {
    // For hackathon: Extract userId from handshake auth or query params
    const userId = socket.handshake.auth.token || socket.handshake.query.userId;

    if (!userId) {
      logger.warn('Socket connection rejected: No userId provided');
      return next(new Error('Authentication error: userId is required'));
    }

    // Attach userId to socket data
    socket.data.userId = userId;
    socket.data.rooms = new Set<string>();

    logger.info('Socket authenticated', { userId, socketId: socket.id });
    next();
  } catch (error) {
    logger.error('Socket authentication error', { error });
    next(new Error('Internal server error during authentication'));
  }
};
