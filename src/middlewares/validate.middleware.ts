import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { BadRequestError } from '../errors/appError';

/**
 * Middleware validating request body against Zod schema.
 */
export const validateBody = (schema: z.ZodTypeAny) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error: unknown) {
      const err = error as { errors?: unknown; message?: string };
      next(new BadRequestError('Validation failed', err.errors || err.message));
    }
  };
};

/**
 * Middleware validating request parameters against Zod schema.
 */
export const validateParams = (schema: z.ZodTypeAny) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      req.params = (await schema.parseAsync(req.params)) as Record<string, string>;
      next();
    } catch (error: unknown) {
      const err = error as { errors?: unknown; message?: string };
      next(new BadRequestError('Validation failed', err.errors || err.message));
    }
  };
};

/**
 * Middleware validating request query parameters against Zod schema.
 */
export const validateQuery = (schema: z.ZodTypeAny) => {
  
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      console.log("VALIDATE QUERY MIDDLEWARE");
console.log(req.query);
      const parsed = await schema.parseAsync(req.query);

      Object.assign(req.query, parsed);

      next();
    } catch (error: unknown) {
      const err = error as { errors?: unknown; message?: string };
      next(new BadRequestError('Validation failed', err.errors || err.message));
    }
  };
};
