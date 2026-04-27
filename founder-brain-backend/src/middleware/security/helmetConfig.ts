import helmet from 'helmet';
import config from '../../config/environment';

/**
 * Configure Helmet.js with secure defaults.
 * Enables CSP, HSTS, X-Frame-Options, X-Content-Type-Options, etc.
 */
export const helmetConfig = () => {
  if (!config.ENABLE_HELMET) {
    return (req: any, res: any, next: any) => next();
  }

  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net"],
        styleSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net"],
        connectSrc: ["'self'", "api.openai.com", "generativelanguage.googleapis.com"],
        imgSrc: ["'self'", "data:", "https:"],
        fontSrc: ["'self'", "cdn.jsdelivr.net"],
      },
      reportOnly: false,
    },
    crossOriginEmbedderPolicy: false, // Turn off if it breaks things during development
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    xFrameOptions: { action: 'deny' },
    xContentTypeOptions: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  });
};
