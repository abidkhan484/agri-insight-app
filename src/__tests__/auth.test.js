import { describe, it, expect } from 'vitest';
import { generateSupabaseJWT, parseTelegramUser } from '../services/auth.js';
import jwt from 'jsonwebtoken';
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
});
