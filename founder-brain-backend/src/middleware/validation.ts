import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';

/**
 * Validation middleware factory.
 */
export const validateBody = (schema: z.ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        status: 'fail',
        errors: error.issues.map((i) => ({ path: i.path, message: i.message })),
      });
    }
    next(error);
  }
};

export const validateQuery = (schema: z.ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
  try {
    req.query = schema.parse(req.query) as any;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        status: 'fail',
        errors: error.issues.map((i) => ({ path: i.path, message: i.message })),
      });
    }
    next(error);
  }
};

export const validateParams = (schema: z.ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
  try {
    req.params = schema.parse(req.params) as any;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        status: 'fail',
        errors: error.issues.map((i) => ({ path: i.path, message: i.message })),
      });
    }
    next(error);
  }
};

/**
 * Validates that a parameter is a valid MongoDB ObjectId.
 * @param paramName - The name of the parameter.
 */
export const validateObjectId = (paramName: string) => (req: Request, res: Response, next: NextFunction) => {
  const id = req.params[paramName];
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      status: 'fail',
      message: `Invalid ID format for ${paramName}`,
    });
  }
  next();
};
