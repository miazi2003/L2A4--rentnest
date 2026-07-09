type LogLevel = 'info' | 'warn' | 'error' | 'debug';

const COLORS = {
  reset: '\x1b[0m',
  info: '\x1b[36m', // Cyan
  warn: '\x1b[33m', // Yellow
  error: '\x1b[31m', // Red
  debug: '\x1b[90m', // Gray
};

const formatMessage = (level: LogLevel, message: string): string => {
  const timestamp = new Date().toISOString();
  const color = COLORS[level] || COLORS.reset;
  return `[${timestamp}] [${color}${level.toUpperCase()}${COLORS.reset}]: ${message}`;
};

export const logger = {
  info: (message: string, ...meta: unknown[]) => {
    console.info(formatMessage('info', message), ...meta);
  },
  warn: (message: string, ...meta: unknown[]) => {
    console.warn(formatMessage('warn', message), ...meta);
  },
  error: (message: string, ...meta: unknown[]) => {
    console.error(formatMessage('error', message), ...meta);
  },
  debug: (message: string, ...meta: unknown[]) => {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.debug(formatMessage('debug', message), ...meta);
    }
  },
};
