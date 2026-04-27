import { Server, Socket } from 'socket.io';
import { ILogger } from '../../interfaces/ILogger';
import { SocketEvents } from '../SocketEvents';

export const registerMeetingHandlers = (io: Server, socket: Socket, logger: ILogger) => {
  socket.on(SocketEvents.MEETING_SUBSCRIBE, (data: { meetingId: string }) => {
    const { meetingId } = data;
    if (!meetingId) return;
    
    const room = `meeting:${meetingId}`;
    socket.join(room);
    logger.info('User subscribed to meeting updates', { userId: socket.data.userId, meetingId });
  });

  socket.on(SocketEvents.MEETING_UNSUBSCRIBE, (data: { meetingId: string }) => {
    const { meetingId } = data;
    if (!meetingId) return;
    
    const room = `meeting:${meetingId}`;
    socket.leave(room);
    logger.info('User unsubscribed from meeting updates', { userId: socket.data.userId, meetingId });
  });
};
