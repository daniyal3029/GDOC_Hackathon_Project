import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { createApiErrorDto } from '../dtos/base/Error.dto';
import logger from '../config/logger';

/**
 * Global Error Handler middleware.
 */
export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const traceId = Math.random().toString(36).substring(2, 11);
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';
  const path = req.path;

  // Log error with context
  logger.error('Unhandled Error', {
    traceId,
    statusCode,
    message,
    path,
    stack: error.stack,
  });

  // Handle Zod Validation Errors
  if (error instanceof z.ZodError) {
    const errorDto = createApiErrorDto(
      400,
      'Validation Failed',
      'Validation Error',
      traceId,
      path,
      error.issues.map(i => ({ path: i.path, message: i.message }))
    );
    return res.status(400).json(errorDto);
  }

  // Handle Operational Errors (AppError)
  if (error.isOperational) {
    const errorDto = createApiErrorDto(
      statusCode,
      message,
      'Operational Error',
      traceId,
      path
    );
    return res.status(statusCode).json(errorDto);
  }

  // Handle Mongoose Errors
  if (error.name === 'ValidationError') {
    const errorDto = createApiErrorDto(
      400,
      'Database validation failed',
      'Validation Error',
      traceId,
      path,
      error.errors
    );
    return res.status(400).json(errorDto);
  }

  // Default Error Response
  const errorDto = createApiErrorDto(
    statusCode,
    message,
    'Internal Error',
    traceId,
    path
  );
  
  res.status(statusCode).json(errorDto);
};
