import { Server, Socket } from 'socket.io';
import { ILogger } from '../../interfaces/ILogger';
import { SocketEvents } from '../SocketEvents';
import { container } from '../../config/container';

export const registerQueryHandlers = (io: Server, socket: Socket, logger: ILogger) => {
  socket.on(SocketEvents.QUERY_ASK, async (data: { question: string; meetingId?: string; requestId?: string }) => {
    const { question, meetingId, requestId = Math.random().toString(36).substring(7) } = data;
    const userId = socket.data.userId;

    if (!question) {
      socket.emit(SocketEvents.QUERY_ERROR, { requestId, message: 'Question is required' });
      return;
    }

    logger.info('Received streaming query request', { userId, question, requestId });

    try {
      // Get streaming service from container
      // Note: We'll use a dynamic import or resolve to avoid circular deps if needed
      // but for now container is simple.
      const streamingService = container.resolve<any>('StreamingQueryService');
      
      await streamingService.streamAnswer(
        question,
        { meetingId, userId },
        socket,
        requestId
      );
    } catch (error: any) {
      logger.error('Error starting streaming query', { userId, requestId, error: error.message });
      socket.emit(SocketEvents.QUERY_ERROR, { requestId, message: error.message });
    }
  });

  socket.on(SocketEvents.QUERY_CANCEL, (data: { requestId: string }) => {
    const { requestId } = data;
    const streamingService = container.resolve<any>('StreamingQueryService');
    streamingService.cancelStream(requestId, socket.id);
    logger.info('Streaming query cancelled by user', { socketId: socket.id, requestId });
  });
};
