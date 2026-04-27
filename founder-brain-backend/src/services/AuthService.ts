import { UserRepository } from '../repositories/UserRepository';
import { TokenService } from './TokenService';
import { OTPService } from './OTPService';
import { EmailService } from './EmailService';
import { ILogger } from '../interfaces/ILogger';
import bcrypt from 'bcrypt';
import config from '../config/environment';

export class AuthService {
  constructor(
    private userRepository: UserRepository,
    private tokenService: TokenService,
    private logger: ILogger,
    private otpService: OTPService,
    private emailService: EmailService
  ) {}

  async register(email: string, password: string, name: string) {
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      if (existingUser.isActive) {
        throw new Error('Email already registered');
      }
      // If user exists but is not active (unverified), we can allow re-registration or just send new OTP
      // For simplicity, let's just update and send new OTP
      const passwordHash = await bcrypt.hash(password, config.BCRYPT_ROUNDS);
      await this.userRepository.update(existingUser.id, { passwordHash, name });
    } else {
      const passwordHash = await bcrypt.hash(password, config.BCRYPT_ROUNDS);
      await this.userRepository.create({
        email,
        passwordHash,
        name,
        isActive: false, // Wait for OTP
      });
    }

    const otp = await this.otpService.generateOTP(email, 'SIGNUP');
    await this.emailService.sendOTP(email, otp, 'SIGNUP');

    this.logger.info('OTP sent for user registration', { email });
    return { message: 'Verification OTP sent to email' };
  }

  async verifySignup(email: string, otp: string) {
    const isValid = await this.otpService.verifyOTP(email, otp, 'SIGNUP');
    if (!isValid) {
      throw new Error('Invalid or expired OTP');
    }

    const user = await this.userRepository.findByEmail(email);
    if (!user) throw new Error('User not found');

    await this.userRepository.update(user.id, { isActive: true });
    this.logger.info('User account verified', { email });

    return { message: 'Account verified successfully. You can now login.' };
  }

  async login(email: string, password: string, ipAddress: string, userAgent: string) {
    const user = await this.userRepository.findByEmail(email);
    if (!user || !user.isActive) {
      this.logger.warn('Failed login attempt: User not found or unverified', { email, ipAddress });
      throw new Error('Invalid email or password (or account unverified)');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      this.logger.warn('Failed login attempt: Invalid password', { email, ipAddress });
      throw new Error('Invalid email or password');
    }

    const version = user.refreshTokenVersion + 1;
    const accessToken = this.tokenService.generateAccessToken(user.id, user.email, version);
    const { token: refreshToken } = this.tokenService.generateRefreshToken(user.id, version);
    const refreshTokenHash = this.tokenService.hashRefreshToken(refreshToken);

    await this.userRepository.update(user.id, {
      refreshTokenHash,
      refreshTokenVersion: version,
      lastLoginAt: new Date(),
    });

    this.logger.info('User logged in successfully', { userId: user.id, ipAddress });

    return {
      user: { id: user.id, email: user.email, name: user.name },
      accessToken,
      refreshToken,
    };
  }

  async forgotPassword(email: string) {
    const user = await this.userRepository.findByEmail(email);
    if (!user || !user.isActive) {
      // Don't reveal if user exists for security?
      return { message: 'If your email is registered, you will receive an OTP' };
    }

    const otp = await this.otpService.generateOTP(email, 'RESET_PASSWORD');
    await this.emailService.sendOTP(email, otp, 'RESET_PASSWORD');
    
    return { message: 'Password reset OTP sent to email' };
  }

  async resetPassword(email: string, otp: string, newPassword: string) {
    const isValid = await this.otpService.verifyOTP(email, otp, 'RESET_PASSWORD');
    if (!isValid) {
      throw new Error('Invalid or expired OTP');
    }

    const user = await this.userRepository.findByEmail(email);
    if (!user) throw new Error('User not found');

    const passwordHash = await bcrypt.hash(newPassword, config.BCRYPT_ROUNDS);
    await this.userRepository.update(user.id, { 
      passwordHash,
      refreshTokenHash: null,
      $inc: { refreshTokenVersion: 1 } // Invalidate existing sessions
    });

    this.logger.info('User password reset successfully', { email });
    return { message: 'Password reset successful' };
  }

  async refreshAccessToken(refreshToken: string, ipAddress: string) {
    const payload = this.tokenService.verifyRefreshToken(refreshToken);
    const user = await this.userRepository.findById(payload.userId);

    if (!user || !user.isActive) {
      throw new Error('User not found or inactive');
    }

    if (user.refreshTokenVersion !== payload.version) {
      this.logger.error('Security Alert: Token version mismatch', { userId: user.id, ipAddress });
      await this.revokeAllUserTokens(user.id);
      throw new Error('Security breach detected. Please login again.');
    }

    const incomingHash = this.tokenService.hashRefreshToken(refreshToken);
    if (user.refreshTokenHash !== incomingHash) {
      this.logger.error('Security Alert: Refresh token hash mismatch', { userId: user.id, ipAddress });
      await this.revokeAllUserTokens(user.id);
      throw new Error('Security breach detected. Please login again.');
    }

    const newVersion = user.refreshTokenVersion + 1;
    const newAccessToken = this.tokenService.generateAccessToken(user.id, user.email, newVersion);
    const { token: newRefreshToken } = this.tokenService.generateRefreshToken(user.id, newVersion);
    const newRefreshTokenHash = this.tokenService.hashRefreshToken(newRefreshToken);

    await this.userRepository.update(user.id, {
      refreshTokenHash: newRefreshTokenHash,
      refreshTokenVersion: newVersion,
    });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  async revokeAllUserTokens(userId: string) {
    await this.userRepository.update(userId, {
      refreshTokenHash: null,
      $inc: { refreshTokenVersion: 1 },
    });
  }

  async logout(userId: string) {
    await this.userRepository.update(userId, {
       refreshTokenHash: null,
       $inc: { refreshTokenVersion: 1 },
    });
  }
}
