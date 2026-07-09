import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { env } from './config/env';
import { requestLogger } from './middlewares/requestLogger.middleware';
import { notFoundHandler } from './middlewares/notFound.middleware';
import { errorHandler } from './middlewares/error.middleware';
import rootRouter from './routes';

const app = express();

// Set security HTTP headers
app.use(helmet());

// Enable CORS with customizable dynamic origins
app.use(
  cors({
    origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(','),
    credentials: true,
  }),
);

// Global rate limiter to protect against brute-force or DDoS requests
const limiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.RATE_LIMIT_MAX,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
});
app.use(limiter);

// Parse JSON request body
app.use(express.json());

// Parse URL-encoded request body
app.use(express.urlencoded({ extended: true }));

// HTTP request logging using morgan streaming to custom logger
app.use(requestLogger);

// Root greeting endpoint
app.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to the RentNest Backend API Starter',
  });
});

// Mount API versioned router
app.use('/api', rootRouter);

// Catch-all 404 error handler for undefined routes
app.use(notFoundHandler);

// Global error response handler middleware
app.use(errorHandler);

export default app;
