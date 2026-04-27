import { CookieOptions } from 'express';
import config from './environment';

export const accessTokenCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: config.COOKIE_SECURE,
  sameSite: config.COOKIE_SAME_SITE,
  maxAge: config.JWT_ACCESS_EXPIRY * 1000,
  path: '/',
  domain: config.COOKIE_DOMAIN === 'localhost' ? undefined : config.COOKIE_DOMAIN,
};

export const refreshTokenCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: config.COOKIE_SECURE,
  sameSite: config.COOKIE_SAME_SITE,
  maxAge: config.JWT_REFRESH_EXPIRY * 1000,
  path: '/api/auth/refresh', // Only sent to refresh endpoint
  domain: config.COOKIE_DOMAIN === 'localhost' ? undefined : config.COOKIE_DOMAIN,
};

export const csrfCookieOptions: CookieOptions = {
  httpOnly: false, // Frontend needs to read XSRF-TOKEN cookie
  secure: config.COOKIE_SECURE,
  sameSite: config.COOKIE_SAME_SITE,
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
};
