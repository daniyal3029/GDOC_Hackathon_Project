import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import config from '../config/environment';
import { AccessTokenPayload, RefreshTokenPayload } from '../types/auth.types';

export class TokenService {
  generateAccessToken(userId: string, email: string, version: number): string {
    return jwt.sign(
      { userId, email, version },
      config.JWT_ACCESS_SECRET,
      { expiresIn: config.JWT_ACCESS_EXPIRY }
    );
  }

  generateRefreshToken(userId: string, version: number): { token: string; tokenId: string } {
    const tokenId = uuidv4();
    const token = jwt.sign(
      { userId, tokenId, version },
      config.JWT_REFRESH_SECRET,
      { expiresIn: config.JWT_REFRESH_EXPIRY }
    );
    return { token, tokenId };
  }

  verifyAccessToken(token: string): AccessTokenPayload {
    try {
      return jwt.verify(token, config.JWT_ACCESS_SECRET) as AccessTokenPayload;
    } catch (error) {
      throw new Error('Invalid or expired access token');
    }
  }

  verifyRefreshToken(token: string): RefreshTokenPayload {
    try {
      return jwt.verify(token, config.JWT_REFRESH_SECRET) as RefreshTokenPayload;
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  hashRefreshToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
