import http from 'http';
import app from './app';
import { env } from './config/env';
import { logger } from './utils/logger';
import { prisma } from './config/db';

const server = http.createServer(app);

const startServer = async () => {
  try {
    logger.info('Connecting to PostgreSQL database via Prisma...');
    await prisma.$connect();
    logger.info('Database connection successfully established.');

    server.listen(env.PORT, () => {
      logger.info(
        `🚀 RentNest backend server running in '${env.NODE_ENV}' mode on port ${env.PORT}`,
      );
    });
  } catch (error) {
    logger.error('Database connection failed. Unable to start server.', error);
    process.exit(1);
  }
};

const gracefulShutdown = async (signal: string) => {
  logger.warn(`Received ${signal}. Commencing graceful shutdown of HTTP server...`);

  server.close(async () => {
    logger.info('HTTP server closed.');

    try {
      await prisma.$disconnect();
      logger.info('Database connection disconnected.');
      process.exit(0);
    } catch (err) {
      logger.error('Error occurred while disconnecting database client:', err);
      process.exit(1);
    }
  });

  // Force close if tasks do not complete within 10s
  setTimeout(() => {
    logger.error('Graceful shutdown timeout exceeded. Forcing exit...');
    process.exit(1);
  }, 10000);
};

// Process listeners for termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Process listeners for unexpected errors
process.on('uncaughtException', (error) => {
  logger.error('CRITICAL: Uncaught Exception detected:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('CRITICAL: Unhandled Promise Rejection detected:', reason);
  process.exit(1);
});

startServer();
