import { Request, Response, NextFunction } from 'express';

/**
 * Basic connection and timeout middleware to mitigate simple Slowloris DDoS attacks.
 * Limits the payload size manually based on paths.
 * 
 * Note: Real concurrent connections limit is usually handled at the reverse proxy (Nginx/HAProxy) level,
 * but Express can enforce some rudimentary timeouts.
 */
export const ddosProtection = (req: Request, res: Response, next: NextFunction) => {
  // Enforce server timeouts
  // 10 seconds total request processing limit
  req.setTimeout(10000, () => {
    if (!res.headersSent) {
      res.status(408).send('Request Timeout');
    }
  });

  // Example basic endpoint payload size restrictions (preventing memory exhaustion)
  const contentLength = parseInt(req.headers['content-length'] || '0', 10);
  
  // Custom limit for meeting process
  if (req.path === '/api/meetings/process' && contentLength > 50000 * 4) { // Roughly 200KB max for 50,000 chars text
    return res.status(413).json({ success: false, error: 'Payload Too Large: Meeting text exceeds acceptable length.' });
  }

  // Custom limit for queries
  if (req.path === '/api/query' && contentLength > 2000) { // Approx 2KB for question
    return res.status(413).json({ success: false, error: 'Payload Too Large: Query text exceeds acceptable length.' });
  }

  next();
};
