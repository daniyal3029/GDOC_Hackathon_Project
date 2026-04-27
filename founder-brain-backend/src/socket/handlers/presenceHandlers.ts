import { Server, Socket } from 'socket.io';
import { ILogger } from '../../interfaces/ILogger';
import { IPresenceService } from '../../interfaces/IPresenceService';
import { SocketEvents } from '../SocketEvents';

export const registerPresenceHandlers = (io: Server, socket: Socket, logger: ILogger, presenceService: IPresenceService) => {
  const userId = socket.data.userId;

  socket.on(SocketEvents.PRESENCE_JOIN, async (data: { roomId: string }) => {
    const { roomId } = data;
    if (!roomId) return;

    await presenceService.userJoinRoom(userId, socket.id, roomId);
    socket.join(roomId);

    // Notify others in the room
    socket.to(roomId).emit(SocketEvents.PRESENCE_JOINED, { 
      userId, 
      joinedAt: new Date().toISOString() 
    });

    // Send current users in room to the joining user
    const users = await presenceService.getUsersInRoom(roomId);
    socket.emit(SocketEvents.PRESENCE_USERS, { roomId, users });

    logger.info('User joined room presence', { userId, roomId });
  });

  socket.on(SocketEvents.PRESENCE_LEAVE, async (data: { roomId: string }) => {
    const { roomId } = data;
    if (!roomId) return;

    await presenceService.userLeaveRoom(userId, socket.id, roomId);
    socket.leave(roomId);

    // Notify others
    socket.to(roomId).emit(SocketEvents.PRESENCE_LEFT, { 
      userId, 
      leftAt: new Date().toISOString() 
    });

    logger.info('User left room presence', { userId, roomId });
  });

  socket.on(SocketEvents.PRESENCE_PING, async () => {
    await presenceService.heartbeat(userId, socket.id);
  });
};
