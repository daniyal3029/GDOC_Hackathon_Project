import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to extract and validate pagination parameters from query string.
 */
export const paginationMiddleware = (req: Request, res: Response, next: NextFunction) => {
  let page = parseInt(req.query.page as string, 10) || 1;
  let limit = parseInt(req.query.limit as string, 10) || 20;

  if (page < 1) page = 1;
  if (limit < 1) limit = 1;
  if (limit > 100) limit = 100;

  const skip = (page - 1) * limit;

  (req as any).pagination = {
    page,
    limit,
    skip,
  };

  next();
};

export default paginationMiddleware;
