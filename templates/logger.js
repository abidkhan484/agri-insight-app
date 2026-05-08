/**
 * templates/logger.js
 * Canonical Winston logger for all Node.js services in this project.
 *
 * Usage:
 *   Copy to your project: cp templates/logger.js config/logger.js
 *   Import: import logger from '../config/logger.js';
 *
 * Log levels: error > warn > info > debug
 *   - Production: INFO and above (set LOG_LEVEL=info in .env)
 *   - Development: DEBUG and above (default when NODE_ENV != 'production')
 *
 * Security rules:
 *   - NEVER log raw telegram_id — use { farmer: 'id:' + telegramId }
 *   - NEVER log tokens, passwords, or API keys
 *   - Log context objects, not interpolated strings
 *
 * Example usage:
 *   logger.info('Plot registered', { farmerId, plotName, areaDecimal });
 *   logger.warn('Invalid date input', { input: dateStr, farmerId: 'id:' + tid });
 *   logger.error('DB write failed', { table: 'plots', error: err.message });
 *   logger.debug('Cron triggered', { job: 'jeevamrutha-check' });
 */

import { createLogger, format, transports } from 'winston';
import { mkdirSync } from 'fs';

// Ensure logs/ directory exists at startup
mkdirSync('logs', { recursive: true });

const { combine, timestamp, errors, json, colorize, simple } = format;

const logger = createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    json(),
  ),
  defaultMeta: { service: process.env.SERVICE_NAME || 'agri-bot' },
  transports: [
    new transports.Console({
      format: combine(colorize(), simple()),
    }),
    new transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5 * 1024 * 1024, // 5MB
      maxFiles: 5,
      tailable: true,
    }),
    new transports.File({
      filename: 'logs/combined.log',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 10,
      tailable: true,
    }),
  ],
  exitOnError: false,
});

export default logger;
