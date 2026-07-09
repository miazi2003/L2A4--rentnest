import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import { env } from '../config/env';
import { prisma } from '../config/db';
import { UnauthorizedError, ForbiddenError } from '../errors/appError';

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}

// Extend Express Request interface globally
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
      };
    }
  }
}

/**
 * Middleware ensuring request is authenticated via JWT.
 * Optionally verifies if the logged-in user belongs to allowed roles.
 */
export const auth = (...roles: UserRole[]) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedError('You are not authorized to access this resource');
      }

      const token = authHeader.split(' ')[1];
      let decoded: JwtPayload;

      try {
        decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
      } catch {
        throw new UnauthorizedError('Invalid or expired token');
      }

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user) {
        throw new UnauthorizedError('User does not exist');
      }

      if (user.status === 'BANNED') {
        throw new ForbiddenError('Your account has been banned');
      }

      // Populate user info on request object
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
      };

      // Handle role-based access checks if roles list is specified
      if (roles.length > 0 && !roles.includes(user.role)) {
        throw new ForbiddenError('You do not have permission to access this resource');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
