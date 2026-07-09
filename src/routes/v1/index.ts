import { Router, Request, Response } from 'express';
import { ApiResponse } from '../../utils/apiResponse';

const v1Router = Router();

/**
 * @route GET /api/v1/health
 * @desc System health check endpoint
 * @access Public
 */
v1Router.get('/health', (_req: Request, res: Response) => {
  ApiResponse.success(res, 200, 'RentNest API is healthy', {
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    status: 'UP',
  });
});

export default v1Router;
