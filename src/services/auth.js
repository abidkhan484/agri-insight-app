import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import logger from '../config/logger.js';

/**
 * Validates the data received from the Telegram WebApp SDK.
 * @see https://core.telegram.org/bots/webapps#validating-data-received-via-the-web-app
 */
export function validateTelegramInitData(initData) {
  if (!initData) return false;

  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');

    // Create data-check-string
    const params = [];
    for (const [key, value] of urlParams.entries()) {
      if (key !== 'hash') {
        params.push(`${key}=${value}`);
      }
    }
    const dataCheckString = params.sort().join('\n');

    // Calculate HMAC
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(config.botToken).digest();
    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    return calculatedHash === hash;
  } catch (error) {
    logger.error('Error validating Telegram initData', { error });
    return false;
  }
}

/**
 * Generates a Supabase-compatible JWT for a Telegram user.
 * The JWT contains a custom 'telegram_id' claim for RLS policies.
 */
export function generateSupabaseJWT(telegramId) {
  if (!config.supabaseJwtSecret) {
    logger.error('SUPABASE_JWT_SECRET is not configured');
    throw new Error('Authentication configuration error');
  }

  const payload = {
    role: 'authenticated',
    sub: telegramId.toString(),
    telegram_id: telegramId.toString(),
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24 hours
    aud: 'authenticated',
    iss: 'zbnf-farming-assistant',
  };

  return jwt.sign(payload, config.supabaseJwtSecret);
}

/**
 * Parses user object from Telegram initData
 */
export function parseTelegramUser(initData) {
  try {
    const urlParams = new URLSearchParams(initData);
    const userStr = urlParams.get('user');
    if (!userStr) return null;
    return JSON.parse(userStr);
  } catch (error) {
    logger.error('Error parsing Telegram user from initData', { error });
    return null;
  }
}

/**
 * Validates data received from the Telegram Login Widget (OAuth).
 * Uses a different algorithm from the WebApp SDK validation.
 * @see https://core.telegram.org/widgets/login#checking-authorization
 */
export function validateTelegramOAuthData(oauthData) {
  if (!oauthData || !oauthData.hash || !oauthData.id) return false;

  try {
    // Check auth_date freshness (reject if older than 24 hours)
    const authDate = parseInt(oauthData.auth_date, 10);
    if (isNaN(authDate)) return false;

    const now = Math.floor(Date.now() / 1000);
    const MAX_AGE_SECONDS = 86400; // 24 hours
    if (now - authDate > MAX_AGE_SECONDS) {
      logger.warn('Telegram OAuth data expired', { authDate, now });
      return false;
    }

    const { hash, ...dataFields } = oauthData;

    // Build data-check-string: alphabetically sorted "key=value" joined by \n
    const dataCheckString = Object.keys(dataFields)
      .sort()
      .map((key) => `${key}=${dataFields[key]}`)
      .join('\n');

    // Secret key = SHA256(bot_token) — different from WebApp validation!
    const secretKey = crypto.createHash('sha256').update(config.botToken).digest();

    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    return calculatedHash === hash;
  } catch (error) {
    logger.error('Error validating Telegram OAuth data', { error });
    return false;
  }
}
