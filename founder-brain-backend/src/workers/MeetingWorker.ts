import { Job } from 'bullmq';
import mongoose from 'mongoose';
import { AIService } from '../services/AIService';
import { IMeetingRepository } from '../interfaces/IMeetingRepository';
import { ITaskRepository } from '../interfaces/ITaskRepository';
import { ILogger } from '../interfaces/ILogger';
import { ISocketServer } from '../interfaces/ISocketServer';
import { MeetingJobData } from '../types/job.types';
import { addEmbeddingJob } from '../queues/embeddingQueue';
import { SocketEvents } from '../socket/SocketEvents';
import { runTransaction } from '../utils/transactionRunner';

/**
 * Worker implementation for processing meeting notes.
 */
export class MeetingWorker {
  constructor(
    private aiService: AIService,
    private meetingRepository: IMeetingRepository,
    private taskRepository: ITaskRepository,
    private socketServer: ISocketServer,
    private logger: ILogger
  ) {}

  /**
   * Process a single meeting job.
   */
  async process(job: Job<MeetingJobData>): Promise<void> {
    const { meetingId, text } = job.data;
    const startTime = Date.now();
    const room = `meeting:${meetingId}`;

    this.logger.info('Starting meeting processing job', { jobId: job.id, meetingId });

    try {
      // 1. Update status to processing
      await this.meetingRepository.updateStatus(meetingId, 'processing');
      await job.updateProgress(10);
      this.socketServer.emitToRoom(room, SocketEvents.MEETING_STATUS, { 
        meetingId, 
        status: 'processing', 
        progress: 10,
        step: 'queued'
      });

      // 2. Extract AI insights (OUTSIDE transaction as it's an external API call)
      this.logger.info('Calling AI Service...', { meetingId });
      this.socketServer.emitToRoom(room, SocketEvents.MEETING_STATUS, { 
        meetingId, 
        status: 'processing', 
        progress: 30,
        step: 'ai_analysis'
      });
      
      const aiResult = await this.aiService.processMeetingNotes(text);
      await job.updateProgress(40);

      // 3. Extract metadata
      const wordCount = text.split(/\s+/).length;
      const mentionedPeople = this.aiService.extractMentionedPeople(text);
      const hasDeadlines = aiResult.tasks.some(t => t.deadline !== null);

      await job.updateProgress(60);
      this.socketServer.emitToRoom(room, SocketEvents.MEETING_STATUS, { 
        meetingId, 
        status: 'processing', 
        progress: 70,
        step: 'saving_tasks'
      });

      // 4. Create tasks and update meeting atomically using ACID transaction
      await runTransaction(async (session) => {
        // Create tasks
        const taskData = aiResult.tasks.map(t => ({
          description: t.task,
          owner: t.owner,
          deadline: t.deadline ? new Date(t.deadline) : null,
          meetingId: new mongoose.Types.ObjectId(meetingId),
        }));

        const createdTasks = await this.taskRepository.createMany(taskData, { session });
        
        // Emit task creation for each task (after transaction commits conceptually, but we do it here)
        // Note: Socket emits are side-effects and can't be rolled back, 
        // but in a production app you might queue these until after commit.
        createdTasks.forEach(task => {
          if (task.owner) {
            this.socketServer.emitToUser(task.owner, SocketEvents.TASK_CREATED, {
              taskId: task._id,
              description: task.description,
              owner: task.owner,
              meetingId,
              deadline: task.deadline
            });
          }
        });

        const taskIds = createdTasks.map(t => t._id.toString());

        // Update meeting
        const processingDuration = Date.now() - startTime;
        await this.meetingRepository.updateWithTasks(
          meetingId,
          aiResult.summary,
          aiResult.decisions,
          taskIds,
          {
            wordCount,
            hasDeadlines,
            mentionedPeople,
            processingDuration
          },
          { session }
        );
      });

      await job.updateProgress(100);
      this.logger.info('Meeting processing job completed', { jobId: job.id, meetingId });
      
      this.socketServer.emitToRoom(room, SocketEvents.MEETING_COMPLETED, { 
        meetingId, 
        summary: aiResult.summary,
        tasksCount: aiResult.tasks.length,
        decisionsCount: aiResult.decisions.length
      });

      // 5. Trigger embedding generation
      try {
        this.socketServer.emitToRoom(room, SocketEvents.MEETING_STATUS, { 
          meetingId, 
          status: 'processing', 
          progress: 90,
          step: 'generating_embeddings'
        });
        
        await addEmbeddingJob({
          meetingId,
          text,
          summary: aiResult.summary,
          decisions: aiResult.decisions,
        });
      } catch (embedError) {
        this.logger.error('Failed to trigger embedding job', { meetingId, error: embedError });
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during processing';
      this.logger.error('Meeting processing job failed', { jobId: job.id, meetingId, error: errorMessage });
      
      this.socketServer.emitToRoom(room, SocketEvents.MEETING_FAILED, { meetingId, error: errorMessage });

      try {
        await this.meetingRepository.updateStatus(meetingId, 'failed', errorMessage);
      } catch (updateError) {
        this.logger.error('Failed to update meeting status to failed', { meetingId, error: updateError });
      }
      
      throw error;
    }
  }
}
