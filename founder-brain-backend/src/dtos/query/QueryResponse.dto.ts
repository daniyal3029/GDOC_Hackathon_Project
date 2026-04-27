/**
 * DTO for a search source citation.
 */
export interface SourceDto {
  meetingId: string;
  meetingTitle?: string;
  relevanceScore: number;
  excerpt: string;
  chunkIndex?: number;
  matchedAt: string;
}

/**
 * Response DTO for semantic query results.
 */
export class QueryResponseDto {
  question: string;
  answer: string;
  sources: SourceDto[];
  confidence?: number;
  processingTimeMs: number;
  modelUsed: string;
  answeredAt: string;

  constructor(data: {
    question: string;
    answer: string;
    sources: any[];
    confidence?: number;
    processingTimeMs: number;
    modelUsed?: string;
  }) {
    this.question = data.question;
    this.answer = data.answer;
    this.sources = data.sources.map(s => ({
      meetingId: s.meetingId,
      relevanceScore: s.relevanceScore || s.similarity,
      excerpt: s.excerpt || (s.text ? s.text.substring(0, 300) : ''),
      chunkIndex: s.chunkIndex,
      matchedAt: new Date().toISOString()
    }));
    this.confidence = data.confidence;
    this.processingTimeMs = data.processingTimeMs;
    this.modelUsed = data.modelUsed || 'gpt-4o-mini';
    this.answeredAt = new Date().toISOString();
  }

  static fromResults(
    question: string, 
    answer: string, 
    sources: any[], 
    timing: number,
    model?: string
  ): QueryResponseDto {
    return new QueryResponseDto({ question, answer, sources, processingTimeMs: timing, modelUsed: model });
  }
}
