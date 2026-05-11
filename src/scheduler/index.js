import cron from 'node-cron';
import logger from '../config/logger.js';

/**
 * Hourly heartbeat to ensure scheduler is alive
 */
cron.schedule('0 * * * *', () => {
  logger.info('Scheduler heartbeat: Service is active');
});

/**
 * Register a new cron job with logging and error handling
 * @param {string} name - Human readable name for the job
 * @param {string} schedule - Cron schedule string
 * @param {Function} handler - Function to execute
 * @returns {cron.ScheduledTask}
 */
export const registerJob = (name, schedule, handler) => {
  logger.info(`Registering scheduler job: ${name}`, { schedule });

  return cron.schedule(schedule, async () => {
    logger.info(`Starting scheduler job: ${name}`);
    const startTime = Date.now();

    try {
      await handler();
      const duration = Date.now() - startTime;
      logger.info(`Completed scheduler job: ${name}`, { duration: `${duration}ms` });
    } catch (error) {
      logger.error(`Error in scheduler job: ${name}`, error);
    }
  });
};

logger.info('Scheduler service initialized');
