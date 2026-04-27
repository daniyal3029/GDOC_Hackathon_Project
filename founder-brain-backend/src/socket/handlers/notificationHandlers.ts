import { Server, Socket } from 'socket.io';
import { ILogger } from '../../interfaces/ILogger';
import { SocketEvents } from '../SocketEvents';

export const registerNotificationHandlers = (io: Server, socket: Socket, logger: ILogger) => {
  socket.on(SocketEvents.NOTIFICATION_READ, (data: { notificationId: string }) => {
    logger.debug('Client marked notification as read via socket', { notificationId: data.notificationId });
    // Usually handled via REST, but can be added here if needed
  });
};
