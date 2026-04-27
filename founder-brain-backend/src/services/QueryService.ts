import { GoogleGenerativeAI } from '@google/generative-ai';
import crypto from 'crypto';
import { IQueryService } from '../interfaces/IQueryService';
import { IVectorService } from '../interfaces/IVectorService';
import { ICacheService } from '../interfaces/ICacheService';
import { ILogger } from '../interfaces/ILogger';
import { QueryResponse } from '../types/api.types';
import { CachePrefixes, CacheTTLs } from '../config/cacheConfig';
import config from '../config/environment';
import AppError from '../utils/AppError';

/**
 * Implementation of IQueryService using vector context and Google Gemini AI.
 */
export class QueryService implements IQueryService {
  private genAI: GoogleGenerativeAI;

  constructor(
    private vectorService: IVectorService,
    private cacheService: ICacheService,
    private logger: ILogger
  ) {
    this.genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
  }

  async askQuestion(question: string, userId: string, options: any = {}): Promise<QueryResponse> {
    const startTime = Date.now();
    
    // Normalize and hash question for caching
    const normalizedQuestion = question.toLowerCase().trim().replace(/\s+/g, ' ');
    const questionHash = crypto.createHash('md5').update(`${normalizedQuestion}:${userId}`).digest('hex');
    const cacheKey = `${CachePrefixes.QUERY}${questionHash}`;

    // 1. Try Cache
    const cachedResult = await this.cacheService.get<QueryResponse>(cacheKey);
    if (cachedResult) {
      this.logger.info('Returning cached query result', { questionHash });
      return {
        ...cachedResult,
        processingTimeMs: Date.now() - startTime
      } as any;
    }

    this.logger.info('Processing new semantic query via Gemini', { question, userId });

    // 2. Search for relevant context
    const maxChunks = options.maxSources || config.MAX_CONTEXT_CHUNKS || 5;
    const contextResults = await this.vectorService.searchContext(question, userId, maxChunks);

    if (contextResults.length === 0) {
      return {
        answer: "I couldn't find any relevant information in your meeting notes to answer that question.",
        sources: [],
        processingTimeMs: Date.now() - startTime
      } as any;
    }

    // 3. Build prompt with context
    const contextText = contextResults
      .map(r => `[Meeting ID: ${r.meetingId}]: ${r.text}`)
      .join('\n\n');

    const prompt = `
      You are an AI assistant for Founder Brain meeting intelligence. 
      Answer the user's question based ONLY on the provided meeting context.
      
      Instructions:
      - Answer based solely on the provided context.
      - If the context doesn't contain the answer, say "I don't have information about that in your meetings."
      - Cite which meeting provided the information where relevant.
      - Be concise but thorough.
      
      Meeting Context:
      ${contextText}
      
      User Question: ${question}
      
      Answer:
    `.trim();

    // 4. Call Gemini for the answer
    try {
      const model = this.genAI.getGenerativeModel({ model: config.GEMINI_MODEL });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const answer = response.text() || "I'm sorry, I couldn't generate an answer.";
      
      const duration = Date.now() - startTime;

      const queryResult = {
        answer,
        sources: contextResults.map(r => ({
          meetingId: r.meetingId,
          relevanceScore: Math.round(r.similarity * 100) / 100,
          excerpt: r.text.substring(0, 200) + '...'
        })),
        processingTimeMs: duration
      };

      // 5. Save to Cache
      await this.cacheService.set(cacheKey, queryResult, CacheTTLs.QUERY_RESULTS);

      this.logger.info('Query answered and cached successfully (Gemini)', { durationMs: duration });
      return queryResult as any;
    } catch (error: any) {
      this.logger.error('Error in QueryService Gemini call', { error: error.message });
      throw new AppError('Failed to generate answer from AI', 500);
    }
  }

  async streamAnswer(question: string, userId: string, onToken: (token: string) => void): Promise<void> {
    const contextResults = await this.vectorService.searchContext(question, userId);
    
    if (contextResults.length === 0) {
      onToken("I couldn't find any relevant information.");
      return;
    }

    const contextText = contextResults.map(r => `[Meeting ${r.meetingId}]: ${r.text}`).join('\n\n');
    
    const model = this.genAI.getGenerativeModel({ model: config.GEMINI_MODEL });
    const result = await model.generateContentStream(`Context:\n${contextText}\n\nQuestion: ${question}`);

    for await (const chunk of result.stream) {
      const token = chunk.text();
      if (token) onToken(token);
    }
  }
}
