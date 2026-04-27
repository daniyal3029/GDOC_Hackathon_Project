import { Socket } from 'socket.io';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ILogger } from '../interfaces/ILogger';
import { IVectorService } from '../interfaces/IVectorService';
import { SocketEvents } from '../socket/SocketEvents';
import config from '../config/environment';

export class StreamingQueryService {
  private genAI: GoogleGenerativeAI;
  private activeStreams: Set<string> = new Set(); // key: socketId:requestId

  constructor(
    private vectorService: IVectorService,
    private logger: ILogger
  ) {
    this.genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
  }

  async streamAnswer(
    question: string,
    context: { meetingId?: string; userId: string },
    socket: Socket,
    requestId: string
  ): Promise<void> {
    const streamKey = `${socket.id}:${requestId}`;
    
    try {
      this.logger.info('Starting context retrieval for streaming (Gemini)...', { question });
      
      // 1. Retrieve context
      const relevantContext = await this.vectorService.searchContext(question, 5);
      
      const contextText = relevantContext
        .map((c, i) => `[Source ${i + 1} - Meeting ${c.meetingId}]: ${c.text}`)
        .join('\n\n');

      const prompt = `
        You are "Founder Brain", an intelligent meeting assistant. 
        Answer the following question using the provided context from meeting transcripts.
        
        Rules:
        1. If the context doesn't contain the answer, say "I don't have enough information about that in your meetings."
        2. Be concise and professional.
        3. Use bullet points for lists.
        4. Refer to meetings by their source number if relevant.
        
        Context:
        ${contextText}
        
        Question: ${question}
        
        Answer:
      `;

      // 2. Start Streaming with Gemini
      const model = this.genAI.getGenerativeModel({ model: config.GEMINI_MODEL });
      const result = await model.generateContentStream(prompt);
      
      this.activeStreams.add(streamKey);

      let fullAnswer = '';
      
      for await (const chunk of result.stream) {
        // Double check if cancelled
        if (!this.activeStreams.has(streamKey)) {
          this.logger.info('Stream cancelled mid-generation', { streamKey });
          break;
        }

        const content = chunk.text() || '';
        if (content) {
          fullAnswer += content;
          socket.emit(SocketEvents.QUERY_CHUNK, { 
            requestId, 
            token: content, 
            isComplete: false 
          });
        }
      }

      if (this.activeStreams.has(streamKey)) {
        socket.emit(SocketEvents.QUERY_CHUNK, { 
          requestId, 
          token: '', 
          isComplete: true 
        });
        
        socket.emit(SocketEvents.QUERY_COMPLETE, {
          requestId,
          answer: fullAnswer,
          sources: relevantContext.map((c, i) => ({
            id: i + 1,
            meetingId: c.meetingId,
            textSnippet: c.text.substring(0, 100) + '...'
          }))
        });

        this.activeStreams.delete(streamKey);
      }

    } catch (error: any) {
      this.logger.error('Streaming error (Gemini)', { error: error.message });
      socket.emit(SocketEvents.QUERY_ERROR, { requestId, message: error.message });
      this.activeStreams.delete(streamKey);
    }
  }

  cancelStream(requestId: string, socketId: string): void {
    const streamKey = `${socketId}:${requestId}`;
    this.activeStreams.delete(streamKey);
  }
}
