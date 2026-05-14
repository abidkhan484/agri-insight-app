import logger from '../config/logger.js';

const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1/forecast';

/**
 * Fetch 3-day forecast for a GPS coordinate.
 * Retries with exponential backoff (max 3 attempts).
 * @param {number} latitude
 * @param {number} longitude
 * @param {number} attempt
 * @returns {Promise<object>}
 */
export async function fetchForecast(latitude, longitude, attempt = 1) {
  const url = new URL(OPEN_METEO_BASE);
  url.searchParams.set('latitude', latitude.toString());
  url.searchParams.set('longitude', longitude.toString());
  url.searchParams.set('daily', 'precipitation_sum,temperature_2m_max,temperature_2m_min');
  url.searchParams.set('hourly', 'precipitation');
  url.searchParams.set('timezone', 'Asia/Dhaka');
  url.searchParams.set('forecast_days', '3');

  try {
    logger.debug('Fetching weather forecast', { latitude, longitude, attempt });
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`Open-Meteo responded ${res.status}`);
    const data = await res.json();
    logger.info('Weather forecast fetched', { latitude, longitude });
    return parseForecast(data);
  } catch (err) {
    if (attempt < 3) {
      const delay = attempt * 2000;
      logger.warn('Weather fetch failed, retrying', { attempt, delay, error: err.message });
      await new Promise((r) => setTimeout(r, delay));
      return fetchForecast(latitude, longitude, attempt + 1);
    }
    logger.error('Weather fetch failed after 3 attempts', {
      latitude,
      longitude,
      error: err.message,
    });
    throw err;
  }
}

/**
 * Parse the API response into a structured object.
 * @param {object} data
 * @returns {object}
 */
export function parseForecast(data) {
  const precip = data.daily.precipitation_sum;
  const tempMax = data.daily.temperature_2m_max;
  const tempMin = data.daily.temperature_2m_min;
  const hourlyPrecip = data.hourly.precipitation.slice(0, 6); // next 6 hours

  return {
    today: {
      precip_mm: precip[0],
      temp_max: tempMax[0],
      temp_min: tempMin[0],
    },
    tomorrow: {
      precip_mm: precip[1],
      temp_max: tempMax[1],
      temp_min: tempMin[1],
    },
    next48h_precip_total: parseFloat((precip[0] + precip[1]).toFixed(2)),
    rain_in_next_6h: hourlyPrecip.some((h) => h > 0.5),
  };
}
