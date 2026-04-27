import { ILogger } from '../interfaces/ILogger';
import config from '../config/environment';

type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export class CircuitBreaker {
  private state: CircuitBreakerState = 'CLOSED';
  private failureCount: number = 0;
  private successCount: number = 0;
  private nextAttempt: number = 0;
  private failureThreshold: number;
  private timeoutMs: number;
  private halfOpenMaxCalls: number;

  constructor(
    private serviceName: string,
    private logger: ILogger,
    options?: {
      failureThreshold?: number;
      timeoutMs?: number;
      halfOpenMaxCalls?: number;
    }
  ) {
    this.failureThreshold = options?.failureThreshold || config.CIRCUIT_BREAKER_FAILURE_THRESHOLD || 5;
    this.timeoutMs = options?.timeoutMs || config.CIRCUIT_BREAKER_TIMEOUT_MS || 60000;
    this.halfOpenMaxCalls = options?.halfOpenMaxCalls || config.CIRCUIT_BREAKER_HALF_OPEN_MAX_CALLS || 3;
  }

  /**
   * Executes a given operation within the circuit breaker context.
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() > this.nextAttempt) {
        this.transitionTo('HALF_OPEN');
      } else {
        throw new Error(`Service ${this.serviceName} temporarily unavailable (Circuit OPEN)`);
      }
    }

    if (this.state === 'HALF_OPEN' && this.successCount >= this.halfOpenMaxCalls) {
        // Technically this shouldn't happen here, but if it does:
        this.transitionTo('CLOSED');
    }

    try {
      const response = await operation();
      this.onSuccess();
      return response;
    } catch (error: any) {
      this.onFailure(error);
      throw error;
    }
  }

  private onSuccess() {
    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= this.halfOpenMaxCalls) {
        this.transitionTo('CLOSED');
      }
    } else {
      this.failureCount = 0;
    }
  }

  private onFailure(error: any) {
    this.logger.warn(`Failure recorded in Circuit Breaker for ${this.serviceName}`, { error: error.message });
    this.failureCount++;

    if (this.state === 'CLOSED' && this.failureCount >= this.failureThreshold) {
      this.transitionTo('OPEN');
    } else if (this.state === 'HALF_OPEN') {
      this.transitionTo('OPEN');
    }
  }

  private transitionTo(newState: CircuitBreakerState) {
    this.logger.warn(`Circuit Breaker for ${this.serviceName} transitioning from ${this.state} to ${newState}`);
    this.state = newState;
    
    if (newState === 'OPEN') {
      this.nextAttempt = Date.now() + this.timeoutMs;
      this.successCount = 0;
    } else if (newState === 'HALF_OPEN') {
      this.successCount = 0;
    } else if (newState === 'CLOSED') {
      this.failureCount = 0;
      this.successCount = 0;
    }
  }

  getState() {
    return this.state;
  }
}
