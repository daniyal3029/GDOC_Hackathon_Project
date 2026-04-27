import { Request, Response, NextFunction } from 'express';
import { IQueryService } from '../interfaces/IQueryService';
import { ILogger } from '../interfaces/ILogger';
import { ApiResponse } from '../dtos/base/ApiResponse.dto';
import { AskQuestionRequestSchema } from '../dtos/query/AskQuestion.dto';
import { QueryResponseDto } from '../dtos/query/QueryResponse.dto';

/**
 * Controller for handling semantic queries and natural language Q&A.
 */
export class QueryController {
  constructor(
    private queryService: IQueryService,
    private logger: ILogger
  ) {}

  /**
   * Asks a question based on indexed meeting content.
   */
  askQuestion = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = AskQuestionRequestSchema.parse(req.body);
      
      this.logger.info('Received semantic query', { question: validated.question });

      const result = await this.queryService.askQuestion(validated.question, { 
        maxSources: validated.maxSources 
      });
      
      const responseDto = new QueryResponseDto({
        ...result,
        question: validated.question,
      });
      return res.status(200).json(ApiResponse.success(responseDto));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Returns suggested questions for the user.
   */
  getSuggestions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const suggestions = [
        "What are the key decisions from this week?",
        "What tasks are assigned to me?",
        "What did we discuss about the project launch?",
        "Are there any upcoming deadlines?",
        "Summarize the discussions about pricing."
      ];
      
      return res.status(200).json(ApiResponse.success({ suggestions }));
    } catch (error) {
      next(error);
    }
  };
}
