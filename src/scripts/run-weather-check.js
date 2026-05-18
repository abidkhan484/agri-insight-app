import { Telegraf } from 'telegraf';
import { config } from '../config/index.js';
import logger from '../config/logger.js';
import { dbService } from '../db/service.js';
import { fetchForecast } from '../services/weather.js';
import { getIrrigationAdvice } from '../services/irrigation-advisor.js';
import { NotificationService } from '../services/notification.js';

/**
 * Standalone Weather Check Script
 */
async function runWeatherCheck() {
  logger.info('Starting manual weather alert check');

  if (!config.botToken) {
    logger.error('BOT_TOKEN is missing. Cannot send alerts.');
    process.exit(1);
  }

  const bot = new Telegraf(config.botToken);

  const plots = await dbService.getPlotsWithGPS();

  if (plots.length === 0) {
    logger.info('No plots with GPS coordinates found');
    return;
  }

  // Deduplicate by GPS coordinate
  const coordGroups = {};
  for (const plot of plots) {
    const key = `${plot.latitude},${plot.longitude}`;
    if (!coordGroups[key]) coordGroups[key] = [];
    coordGroups[key].push(plot);
  }

  for (const [coord, coordPlots] of Object.entries(coordGroups)) {
    const [lat, lon] = coord.split(',').map(Number);
    try {
      logger.info(`Fetching weather for ${coord}`);
      const forecast = await fetchForecast(lat, lon);
      for (const plot of coordPlots) {
        const alerts = getIrrigationAdvice(forecast, null);
        for (const alert of alerts) {
          const message = `${alert.message_bn}\n${alert.message_en}`;
          const farmer = plot.farmers;
          const sent = await NotificationService.send(bot, farmer.telegram_id, message);

          if (sent) {
            logger.info('Weather alert sent', { plotId: plot.id, alertType: alert.type });
            await dbService.logWeatherAlert(plot.id, alert.type, message, forecast);
          }
        }
      }
    } catch (err) {
      logger.error('Weather alert failed for coordinate', { coord, error: err.message });
    }
  }

  logger.info('Manual weather alert check completed');
}

runWeatherCheck().catch((err) => {
  logger.error('Fatal error in weather check script', err);
  process.exit(1);
});
