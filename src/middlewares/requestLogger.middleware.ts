import morgan from 'morgan';
import { logger } from '../utils/logger';
import { env } from '../config/env';

const stream = {
  write: (message: string) => logger.info(message.trim()),
};

const skip = () => {
  return env.NODE_ENV === 'test';
};

// Developer-friendly visual logging in development, production-ready 'combined' formatting in production
const format = env.NODE_ENV === 'development' ? 'dev' : 'combined';

export const requestLogger = morgan(format, { stream, skip });
