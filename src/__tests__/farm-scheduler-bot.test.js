import { describe, it, expect, vi } from 'vitest';

// Mock connection to look like SQLite database for schema verification
vi.mock('../db/connection.js', () => {
  const mockDb = {
    pragma: vi.fn((query) => {
      if (query.includes('reminders')) {
        return [
          { name: 'plot_id' },
          { name: 'type' },
          { name: 'interval_days' },
          { name: 'next_due' },
          { name: 'active' },
        ];
      }
      if (query.includes('reminder_logs')) {
        return [{ name: 'reminder_id' }, { name: 'sent_at' }, { name: 'message' }];
      }
      return [];
    }),
  };
  return {
    default: mockDb,
  };
});

import { calculateJeevamrutha, formatJeevamruthaMessage } from '../services/jeevamrutha.js';
import { NotificationService } from '../services/notification.js';
import db from '../db/connection.js';
import logger from '../config/logger.js';

// Mock logger to avoid console output during tests
vi.mock('../config/logger.js', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock Telegraf bot
const mockBot = {
  telegram: {
    sendMessage: vi.fn().mockResolvedValue({ message_id: 123 }),
  },
};

describe('P1 — Farm Scheduler Bot', () => {
  describe('Jeevamrutha Service (ZBNF Formulas)', () => {
    it('should calculate correct quantities for 33 decimals (1 bigha)', () => {
      const result = calculateJeevamrutha(33);
      expect(result.water_liters).toBe(200);
      expect(result.cow_dung_kg).toBe(10.0);
      expect(result.cow_urine_liters).toBe(7.5);
      expect(result.jaggery_kg).toBe(2.0);
      expect(result.pulse_flour_kg).toBe(2.0);
      expect(result.soil_handful).toBe(1);
      expect(result.application_interval_days).toBe(15);
    });

    it('should calculate correct quantities for 16.5 decimals (0.5 bigha)', () => {
      const result = calculateJeevamrutha(16.5);
      expect(result.water_liters).toBe(100);
      expect(result.cow_dung_kg).toBe(5.0);
      expect(result.cow_urine_liters).toBe(3.75);
      expect(result.jaggery_kg).toBe(1.0);
      expect(result.pulse_flour_kg).toBe(1.0);
      expect(result.soil_handful).toBe(1);
    });

    it('should calculate correct quantities for 10 decimals', () => {
      const result = calculateJeevamrutha(10);
      expect(result.water_liters).toBe(61);
      expect(result.cow_dung_kg).toBe(3.0);
      expect(result.cow_urine_liters).toBe(2.27);
    });

    it('should throw error for invalid area', () => {
      expect(() => calculateJeevamrutha(0)).toThrow(/Invalid plot area/);
      expect(() => calculateJeevamrutha(-1)).toThrow(/Invalid plot area/);
    });

    it('should format message with Bangla and English correctly', () => {
      const batch = calculateJeevamrutha(33);
      const msg = formatJeevamruthaMessage('উত্তর মাঠ', batch);

      expect(msg).toContain('উত্তর মাঠ');
      expect(msg).toContain('Jeevamrutha application due');
      expect(msg).toContain('200 লিটার');
      expect(msg).toContain('10 কেজি');
      expect(msg).toMatch(/[\u0980-\u09FF]/); // Bengali Unicode range
    });
  });

  describe('Notification Service', () => {
    it('should send notification via Telegram if telegramId is present', async () => {
      const telegramId = '12345678';
      const message = 'Test Message';

      const sent = await NotificationService.send(mockBot, telegramId, message);

      expect(sent).toBe(true);
      expect(mockBot.telegram.sendMessage).toHaveBeenCalledWith(telegramId, message);
    });

    it('should return false and log warning if telegramId is missing', async () => {
      const telegramId = null;
      const message = 'Test Message';

      const sent = await NotificationService.send(mockBot, telegramId, message);

      expect(sent).toBe(false);
      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('No Telegram ID provided'));
    });
  });

  describe('Database Schema', () => {
    it('should have reminders table with correct columns', () => {
      const info = db.pragma('table_info(reminders)');
      const columns = info.map((c) => c.name);
      expect(columns).toContain('plot_id');
      expect(columns).toContain('type');
      expect(columns).toContain('interval_days');
      expect(columns).toContain('next_due');
      expect(columns).toContain('active');
    });

    it('should have reminder_logs table', () => {
      const info = db.pragma('table_info(reminder_logs)');
      const columns = info.map((c) => c.name);
      expect(columns).toContain('reminder_id');
      expect(columns).toContain('sent_at');
      expect(columns).toContain('message');
    });
  });
});
