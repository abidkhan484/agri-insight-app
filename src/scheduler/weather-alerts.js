import db from '../db/connection.js';
import logger from '../config/logger.js';
import { registerJob } from './index.js';
import { fetchForecast } from '../services/weather.js';
import { getIrrigationAdvice } from '../services/irrigation-advisor.js';
import { NotificationService } from '../services/notification.js';

/**
 * Weather Alert Engine
 * Runs daily at 6 AM BDT (00:00 UTC)
 * @param {object} bot - Telegraf bot instance
 */
export const initWeatherAlertEngine = (bot) => {
  registerJob('weather-irrigation-alert', '0 0 * * *', async () => {
    logger.info('Weather alert cron triggered');
    const plots = db
      .prepare(
        `
      SELECT p.*, f.telegram_id
      FROM plots p
      JOIN farmers f ON p.farmer_id = f.id
      WHERE p.latitude IS NOT NULL AND p.longitude IS NOT NULL
    `,
      )
      .all();

    if (plots.length === 0) {
      logger.info('No plots with GPS coordinates found for weather alerts');
      return;
    }

    // Deduplicate by GPS coordinate to avoid redundant API calls
    const coordGroups = {};
    for (const plot of plots) {
      const key = `${plot.latitude},${plot.longitude}`;
      if (!coordGroups[key]) coordGroups[key] = [];
      coordGroups[key].push(plot);
    }

    for (const [coord, coordPlots] of Object.entries(coordGroups)) {
      const [lat, lon] = coord.split(',').map(Number);
      try {
        const forecast = await fetchForecast(lat, lon);
        for (const plot of coordPlots) {
          const alerts = getIrrigationAdvice(forecast, null); // soil sensor optional
          for (const alert of alerts) {
            const message = `${alert.message_bn}\n${alert.message_en}`;
            const sent = await NotificationService.send(bot, plot.telegram_id, message);

            if (sent) {
              logger.info('Weather alert sent', { plotId: plot.id, alertType: alert.type });
              db.prepare(
                `
                INSERT INTO weather_alerts (plot_id, alert_type, message, forecast_data)
                VALUES (?, ?, ?, ?)
              `,
              ).run(plot.id, alert.type, message, JSON.stringify(forecast));
            }
          }
        }
      } catch (err) {
        logger.error('Weather alert failed for coordinate', { coord, error: err.message });
      }
    }
  });
};
