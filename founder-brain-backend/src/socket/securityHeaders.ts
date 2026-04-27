import { NextFunction, Request, Response } from 'express';

/**
 * Ensures strict security headers are sent during the initial WebSocket HTTP handshake.
 */
export const wsSecurityHeaders = (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Could optionally add CSP or other headers here
  next();
};
