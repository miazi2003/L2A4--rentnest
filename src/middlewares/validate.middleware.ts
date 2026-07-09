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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      req.query = (await schema.parseAsync(req.query)) as any;
      next();
    } catch (error: unknown) {
      const err = error as { errors?: unknown; message?: string };
      next(new BadRequestError('Validation failed', err.errors || err.message));
    }
  };
};
