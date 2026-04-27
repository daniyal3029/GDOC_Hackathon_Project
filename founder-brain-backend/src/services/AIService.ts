import { GoogleGenerativeAI } from '@google/generative-ai';
import { IAIService } from '../interfaces/IAIService';
import config from '../config/environment';
import logger from '../config/logger';
import AppError from '../utils/AppError';

import { ILogger } from '../interfaces/ILogger';

import { CircuitBreaker } from '../middleware/circuitBreaker';
import { trackAICall } from '../monitoring/metrics/OpenAIMetrics';

/**
 * Implementation of IAIService using Google Gemini.
 */
export class AIService implements IAIService {
  private genAI: GoogleGenerativeAI;
  private circuitBreaker: CircuitBreaker;

  constructor(private logger: ILogger) {
    this.genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
    this.circuitBreaker = new CircuitBreaker('Gemini-AI', logger);
  }

  async processMeetingNotes(text: string): Promise<{
    decisions: string[];
    tasks: Array<{ task: string; owner: string | null; deadline: string | null }>;
    summary: string;
  }> {
    const startTime = Date.now();
    const prompt = `Extract from the following meeting notes:

1. Key decisions made (list each decision as a separate string)
2. Actionable tasks (for each task: description, owner if mentioned, deadline if mentioned)
3. A concise summary (2-3 sentences)

Return ONLY valid JSON with EXACTLY this structure (no other text):
{
  "decisions": ["decision 1", "decision 2"],
  "tasks": [
    {
      "task": "task description here",
      "owner": "person name or null",
      "deadline": "date string in YYYY-MM-DD format or null"
    }
  ],
  "summary": "meeting summary here"
}

Meeting notes:
${text}`;

    if (!config.GEMINI_API_KEY || config.GEMINI_API_KEY === 'your_gemini_api_key_here') {
      logger.info('Using MOCK AI response because GEMINI_API_KEY is missing');
      await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate delay
      return {
        summary: "This is a mock summary of the meeting. The team discussed important product updates and Q3 planning.",
        decisions: ["Proceed with mock data for local testing", "Finalize UI designs by Friday"],
        tasks: [
          { task: "Update the backend mock", owner: "Daniyal", deadline: "2024-12-31" },
          { task: "Review the PR", owner: null, deadline: null }
        ]
      };
    }

    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        attempts++;
        // Execute strictly within Circuit Breaker context
        return await this.circuitBreaker.execute(async () => {
          const model = this.genAI.getGenerativeModel({ model: config.GEMINI_MODEL });
          
          const result = await model.generateContent(prompt);
          const response = await result.response;
          let content = response.text();

          // Clean content if Gemini includes markdown code blocks
          if (content.startsWith('```json')) {
            content = content.replace(/^```json/, '').replace(/```$/, '').trim();
          } else if (content.startsWith('```')) {
            content = content.replace(/^```/, '').replace(/```$/, '').trim();
          }

          const parsedResult = JSON.parse(content);
          
          const duration = Date.now() - startTime;
          trackAICall({ model: config.GEMINI_MODEL, status: 'success', durationMs: duration });
          logger.info('Gemini processing completed', {
            duration,
            attempts,
          });

          return parsedResult;
        });
      } catch (error) {
        trackAICall({ model: config.GEMINI_MODEL, status: 'error', durationMs: Date.now() - startTime });
        logger.error(`Gemini processing attempt ${attempts} failed`, { error });
        
        if (attempts >= maxAttempts) {
          throw new AppError('Gemini processing failed after multiple attempts', 500);
        }
        
        // Don't backoff and retry if the circuit breaker threw because it's open
        if (error instanceof Error && error.message.includes('Circuit OPEN')) {
            throw new AppError('AI service temporarily unavailable. Please try again later.', 503);
        }
        
        // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempts) * 1000));
      }
    }

    throw new AppError('Gemini processing failed', 500);
  }

  extractMentionedPeople(text: string): string[] {
    const namePattern = /\b([A-Z][a-z]+)\b/g;
    const matches = text.match(namePattern) || [];
    return Array.from(new Set(matches));
  }
}
