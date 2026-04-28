import { Request, Response, NextFunction } from 'express';
import { container } from '../config/container';
import { AccessTokenPayload } from '../types/auth.types';

const tokenService = container.getTokenService();
const userRepository = container.resolve<any>('UserRepository');

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1. Development Mode: Support X-User-Id for frontend demo
    if (process.env.NODE_ENV === 'development' && req.headers['x-user-id']) {
      const demoUserId = req.headers['x-user-id'] as string;
      
      // In a real app we'd verify the user exists, but for the hackathon connection
      // we'll inject a mock user payload if the header is present.
      (req as any).user = {
        userId: demoUserId,
        email: 'demo@founderbrain.ai',
        role: 'user',
        version: 0
      };
      
      return next();
    }

    const authHeader = req.headers.authorization;
    let token = '';

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const payload = tokenService.verifyAccessToken(token);
    const user = await userRepository.findById(payload.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'User not found or inactive' });
    }

    // Check if token was revoked via version increment
    if (user.refreshTokenVersion !== payload.version) {
       return res.status(401).json({ success: false, message: 'Token has been revoked. Please login again.' });
    }

    (req as any).user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    let token = '';

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      (req as any).user = null;
      return next();
    }

    const payload = tokenService.verifyAccessToken(token);
    (req as any).user = payload;
    next();
  } catch (error) {
    (req as any).user = null;
    next();
  }
};
