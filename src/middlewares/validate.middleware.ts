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
