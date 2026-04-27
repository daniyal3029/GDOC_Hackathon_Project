import { Redis } from 'ioredis';
import { ILogger } from '../interfaces/ILogger';

export class OTPService {
  private readonly OTP_EXPIRY = 600; // 10 minutes

  constructor(private redis: Redis, private logger: ILogger) {}

  async generateOTP(email: string, type: 'SIGNUP' | 'RESET_PASSWORD'): Promise<string> {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const key = `otp:${type}:${email}`;
    
    await this.redis.set(key, otp, 'EX', this.OTP_EXPIRY);
    this.logger.debug(`Generated OTP for ${email}`, { type });
    return otp;
  }

  async verifyOTP(email: string, otp: string, type: 'SIGNUP' | 'RESET_PASSWORD'): Promise<boolean> {
    const key = `otp:${type}:${email}`;
    const storedOtp = await this.redis.get(key);

    if (storedOtp === otp) {
      await this.redis.del(key);
      return true;
    }

    return false;
  }
}
