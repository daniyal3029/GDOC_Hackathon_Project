import { Server, Socket } from 'socket.io';
import { ILogger } from '../../interfaces/ILogger';
import { SocketEvents } from '../SocketEvents';

export const registerTaskHandlers = (io: Server, socket: Socket, logger: ILogger) => {
  socket.on(SocketEvents.TASK_SUBSCRIBE, (data: { ownerId?: string }) => {
    const { ownerId } = data;
    const room = ownerId ? `tasks:owner:${ownerId}` : 'tasks:all';
    
    socket.join(room);
    logger.info('User subscribed to task updates', { userId: socket.data.userId, room });
  });

  socket.on(SocketEvents.TASK_COMPLETE, (data: { taskId: string; version: number }) => {
    // This could trigger the actual completion if we want to handle logic in sockets
    // but usually, it's better to keep business logic in REST or separate service
    logger.debug('Client requested task completion via socket', { taskId: data.taskId });
  });
};
