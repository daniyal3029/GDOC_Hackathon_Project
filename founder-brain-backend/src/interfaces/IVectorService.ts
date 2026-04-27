/**
 * Interface for Vector Service.
 */
export interface IVectorService {
  /**
   * Chunks and indexes a meeting's content.
   */
  indexMeeting(
    meetingId: string, 
    userId: string,
    text: string, 
    summary: string, 
    decisions: string[]
  ): Promise<number>;

  /**
   * Searches for relevant context based on a natural language query.
   */
  searchContext(
    query: string, 
    userId: string,
    limit?: number
  ): Promise<Array<{
    text: string;
    meetingId: string;
    similarity: number;
    metadata: any;
  }>>;

  /**
   * Deletes a meeting from the vector database.
   */
  deleteMeeting(meetingId: string): Promise<void>;
}
