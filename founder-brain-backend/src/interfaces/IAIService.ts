/**
 * Interface for AI Service.
 */
export interface IAIService {
  /**
   * Process meeting notes using AI to extract summary, decisions, and tasks.
   * @param text - The raw meeting notes text.
   */
  processMeetingNotes(text: string): Promise<{
    decisions: string[];
    tasks: Array<{ task: string; owner: string | null; deadline: string | null }>;
    summary: string;
  }>;

  /**
   * Extract mentioned people from text.
   * @param text - The text to analyze.
   */
  extractMentionedPeople(text: string): string[];
}
