import { Job } from 'bullmq';
import { EmailJobData } from '../types/job.types';
import { EmailService } from '../services/EmailService';
import { ILogger } from '../interfaces/ILogger';

/**
 * Worker class for processing email jobs.
 */
export class EmailWorker {
  constructor(
    private emailService: EmailService,
    private logger: ILogger
  ) {}

  /**
   * Process an email job.
   */
  public async process(job: Job<EmailJobData>): Promise<void> {
    const { email, otp, type } = job.data;
    
    this.logger.info(`Processing email job ${job.id}`, { email, type });

    try {
      await this.emailService.sendOTP(email, otp, type);
      this.logger.info(`Successfully processed email job ${job.id}`, { email, type });
    } catch (error) {
      this.logger.error(`Failed to process email job ${job.id}`, { error, email, type });
      throw error; // Let BullMQ handle retries
    }
  }
}
