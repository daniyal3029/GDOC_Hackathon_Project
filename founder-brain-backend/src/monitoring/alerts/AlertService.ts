import { IncomingWebhook } from '@slack/webhook';
import { AlertPayload, AlertSeverity } from '../../types/monitoring.types';
import { redisClient } from '../../config/redis';
import { monitoringConfig } from '../../config/monitoringConfig';
import logger from '../../config/logger';

/**
 * AlertService manages sending and deduplicating alerts.
 */
export class AlertService {
  private slackWebhook: IncomingWebhook | null = null;

  constructor() {
    if (monitoringConfig.alerts.slackWebhookUrl) {
      this.slackWebhook = new IncomingWebhook(monitoringConfig.alerts.slackWebhookUrl);
    }
  }

  /**
   * Sends an alert, with deduplication to prevent spam.
   */
  async send(payload: AlertPayload): Promise<void> {
    const dedupeKey = `alert:dedup:${payload.title}`;
    const windowMs = monitoringConfig.alerts.deduplicationWindowMs;

    try {
      // Check deduplication
      const exists = await redisClient.get(dedupeKey);
      if (exists) {
        logger.debug(`Alert deduplicated: ${payload.title}`);
        return;
      }

      // Mark as sent
      await redisClient.set(dedupeKey, '1', 'EX', Math.floor(windowMs / 1000));

      // Log the alert
      const logMethod = payload.severity === 'CRITICAL' || payload.severity === 'HIGH' ? 'error' : 'warn';
      logger[logMethod](`ALERT [${payload.severity}]: ${payload.title}`, {
        alertSeverity: payload.severity,
        alertMessage: payload.message,
        metadata: payload.metadata,
      });

      // Send to Slack if configured
      if (this.slackWebhook) {
        await this.sendSlack(payload);
      }
    } catch (error: any) {
      // Alerting system failure should never crash the app
      logger.error('Failed to send alert', { error: error.message, alertTitle: payload.title });
    }
  }

  private async sendSlack(payload: AlertPayload): Promise<void> {
    const severityEmoji: Record<AlertSeverity, string> = {
      LOW: 'ℹ️',
      MEDIUM: '⚠️',
      HIGH: '🔶',
      CRITICAL: '🚨',
    };

    try {
      await this.slackWebhook!.send({
        blocks: [
          {
            type: 'header',
            text: { type: 'plain_text', text: `${severityEmoji[payload.severity]} ${payload.severity}: ${payload.title}` },
          },
          {
            type: 'section',
            fields: [
              { type: 'mrkdwn', text: `*Service:*\n${payload.service}` },
              { type: 'mrkdwn', text: `*Environment:*\n${payload.environment}` },
              { type: 'mrkdwn', text: `*Time:*\n${payload.timestamp.toISOString()}` },
            ],
          },
          {
            type: 'section',
            text: { type: 'mrkdwn', text: payload.message },
          },
        ],
      });
    } catch (error: any) {
      logger.error('Failed to send Slack alert', { error: error.message });
    }
  }
}
