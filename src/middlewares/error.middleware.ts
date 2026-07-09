import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { AppError } from '../errors/appError';
import { logger } from '../utils/logger';
import { ApiResponse } from '../utils/apiResponse';
import { env } from '../config/env';

export const errorHandler = (
  // We use any here since errors can be of any thrown shape/type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  err: any,
  req: Request,
  res: Response,
  // Express error handler middlewares require next parameter to be declared, even if unused
  _next: NextFunction,
): void => {
  let error = err;

  // Handle Prisma Database Error mappings
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002': {
        const targetFields = (err.meta?.target as string[]) || [];
        const fields = targetFields.length > 0 ? ` (${targetFields.join(', ')})` : '';
        error = new AppError(`Record with this unique field${fields} already exists.`, 409, true);
        break;
      }
      case 'P2025':
        error = new AppError('Record not found or access denied.', 404, true);
        break;
      default:
        error = new AppError('Database request failed.', 400, true);
        break;
    }
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    error = new AppError('Invalid database operation request.', 400, true);
  }

  const statusCode = error instanceof AppError ? error.statusCode : 500;
  const message = error instanceof AppError ? error.message : 'Internal Server Error';
  const errors = error instanceof AppError ? error.errors : undefined;

  // Log detailed error or operational warning
  if (statusCode >= 500) {
    logger.error(`[Unhandled Error] ${req.method} ${req.originalUrl}:`, err);
  } else {
    logger.warn(
      `[Operational Error] ${req.method} ${req.originalUrl} - Status: ${statusCode} - Message: ${message}`,
    );
  }

  // Build the error response object
  const errorDetails = {
    ...(errors ? { details: errors } : {}),
    ...(env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  };

  ApiResponse.error(
    res,
    statusCode,
    message,
    Object.keys(errorDetails).length > 0 ? errorDetails : undefined,
  );
};
