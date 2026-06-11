import { describe, it, expect } from 'vitest';
import {
  generateSupabaseJWT,
  parseTelegramUser,
  validateTelegramInitData,
  validateTelegramOAuthData,
} from '../services/auth.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../config/index.js';

describe('Auth Service', () => {
  describe('generateSupabaseJWT', () => {
    it('should generate a valid JWT signed with the configured secret', () => {
      const telegramId = '123456789';
      const token = generateSupabaseJWT(telegramId);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      // Verify the generated token
      const decoded = jwt.verify(token, config.supabaseJwtSecret);
      expect(decoded.telegram_id).toBe(telegramId);
      expect(decoded.sub).toBe(telegramId);
      expect(decoded.role).toBe('authenticated');
      expect(decoded.aud).toBe('authenticated');
      expect(decoded.iss).toBe('zbnf-farming-assistant');
      expect(decoded.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
    });
  });

  describe('parseTelegramUser', () => {
    it('should parse a valid user from initData', () => {
      const user = { id: 123456789, first_name: 'Abid', language_code: 'bn' };
      const initData = `user=${encodeURIComponent(JSON.stringify(user))}&hash=somehash`;

      const parsed = parseTelegramUser(initData);
      expect(parsed).toEqual(user);
    });

    it('should return null if user field is missing', () => {
      const initData = 'hash=somehash';
      const parsed = parseTelegramUser(initData);
      expect(parsed).toBeNull();
    });

    it('should return null on invalid input', () => {
      const parsed = parseTelegramUser(null);
      expect(parsed).toBeNull();
    });
  });

  describe('validateTelegramInitData', () => {
    it('should validate correctly signed initData', () => {
      const token = config.botToken; // '123456789:AAF-fake-bot-token-for-testing'
      const auth_date = Math.floor(Date.now() / 1000).toString();
      const queryParams = {
        auth_date,
        query_id: 'some-query-id',
        user: JSON.stringify({ id: 12345, first_name: 'Test' }),
      };

      // Construct dataCheckString
      const dataCheckString = Object.entries(queryParams)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, val]) => `${key}=${val}`)
        .join('\n');

      const secretKey = crypto.createHmac('sha256', 'WebAppData').update(token).digest();
      const hash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

      const initData = Object.entries(queryParams)
        .map(([key, val]) => `${key}=${encodeURIComponent(val)}`)
        .concat(`hash=${hash}`)
        .join('&');

      expect(validateTelegramInitData(initData)).toBe(true);
    });

    it('should fail validation with invalid hash', () => {
      const initData = 'query_id=some-query-id&hash=invalidhash';
      expect(validateTelegramInitData(initData)).toBe(false);
    });

    it('should return false on empty input', () => {
      expect(validateTelegramInitData('')).toBe(false);
      expect(validateTelegramInitData(null)).toBe(false);
    });
  });

  describe('validateTelegramOAuthData', () => {
    it('should validate correctly signed OAuth data', () => {
      const token = config.botToken;
      const auth_date = Math.floor(Date.now() / 1000).toString();
      const oauthData = {
        id: '123456',
        first_name: 'Test',
        username: 'test_user',
        auth_date,
      };

      const dataCheckString = Object.keys(oauthData)
        .sort()
        .map((key) => `${key}=${oauthData[key]}`)
        .join('\n');

      const secretKey = crypto.createHash('sha256').update(token).digest();
      const hash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

      const dataToValidate = {
        ...oauthData,
        hash,
      };

      expect(validateTelegramOAuthData(dataToValidate)).toBe(true);
    });

    it('should fail validation if data is expired', () => {
      const token = config.botToken;
      // 25 hours ago
      const auth_date = (Math.floor(Date.now() / 1000) - 90000).toString();
      const oauthData = {
        id: '123456',
        first_name: 'Test',
        auth_date,
      };

      const dataCheckString = Object.keys(oauthData)
        .sort()
        .map((key) => `${key}=${oauthData[key]}`)
        .join('\n');

      const secretKey = crypto.createHash('sha256').update(token).digest();
      const hash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

      const dataToValidate = {
        ...oauthData,
        hash,
      };

      expect(validateTelegramOAuthData(dataToValidate)).toBe(false);
    });

    it('should fail validation with invalid hash', () => {
      const oauthData = {
        id: '123456',
        first_name: 'Test',
        auth_date: Math.floor(Date.now() / 1000).toString(),
        hash: 'invalidhash',
      };
      expect(validateTelegramOAuthData(oauthData)).toBe(false);
    });

    it('should return false on empty/invalid data', () => {
      expect(validateTelegramOAuthData(null)).toBe(false);
      expect(validateTelegramOAuthData({})).toBe(false);
    });
  });
});
