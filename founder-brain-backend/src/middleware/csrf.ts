import { doubleCsrf } from 'csrf-csrf';
import { Request, Response } from 'express';
import config from '../config/environment';

export const {
  generateCsrfToken,
  doubleCsrfProtection,
} = doubleCsrf({
  getSecret: () => config.CSRF_SECRET,
  getSessionIdentifier: (req: Request) => (req as any).user?.userId || req.ip,
  cookieName: 'XSRF-TOKEN',
  cookieOptions: {
    httpOnly: false,
    secure: config.COOKIE_SECURE,
    sameSite: config.COOKIE_SAME_SITE,
    path: '/',
  },
  size: 64,
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
  getCsrfTokenFromRequest: (req: Request) => req.headers['x-xsrf-token'] as string,
});
