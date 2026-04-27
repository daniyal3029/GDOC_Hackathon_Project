import { openaiCallsTotal, openaiCallDuration, openaiTokensUsed } from './MetricsService';
import logger from '../../config/logger';

/**
 * Tracks a completed AI/Gemini API call for metrics and cost estimation.
 */
export const trackAICall = (params: {
  model: string;
  status: 'success' | 'error';
  durationMs: number;
  promptTokens?: number;
  completionTokens?: number;
}) => {
  try {
    openaiCallsTotal.inc({ model: params.model, status: params.status });
    openaiCallDuration.observe({ model: params.model }, params.durationMs / 1000);

    const totalTokens = (params.promptTokens || 0) + (params.completionTokens || 0);
    if (totalTokens > 0) {
      openaiTokensUsed.observe({ model: params.model }, totalTokens);
    }

    // Estimate cost (rough Gemini pricing)
    const costPerToken = 0.000001; // ~$1 per 1M tokens
    const estimatedCost = totalTokens * costPerToken;

    if (estimatedCost > 0.10) {
      logger.warn('High cost AI call detected', {
        model: params.model,
        tokens: totalTokens,
        estimatedCost: `$${estimatedCost.toFixed(4)}`,
      });
    }
  } catch (error: any) {
    // Metrics recording failure should never crash the app
    logger.error('Failed to track AI metrics', { error: error.message });
  }
};
