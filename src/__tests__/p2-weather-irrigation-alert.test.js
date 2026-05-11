import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { fetchForecast } from '../services/weather.js';
import { getIrrigationAdvice } from '../services/irrigation-advisor.js';
import db from '../db/connection.js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Mock logger to keep test output clean
vi.mock('../config/logger.js', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock fetch for weather API calls
global.fetch = vi.fn();

describe('P2 — Weather Irrigation Alert', () => {
  beforeAll(() => {
    // Initialize database schema
    const schema = readFileSync(join(process.cwd(), 'db/schema.sql'), 'utf8');
    db.exec(schema);
  });

  describe('Database Structure', () => {
    it('should have the weather_alerts table with correct columns', () => {
      const tableInfo = db.prepare('PRAGMA table_info(weather_alerts)').all();
      const columnNames = tableInfo.map((c) => c.name);

      expect(columnNames).toContain('id');
      expect(columnNames).toContain('plot_id');
      expect(columnNames).toContain('alert_type');
      expect(columnNames).toContain('message');
      expect(columnNames).toContain('forecast_data');
      expect(columnNames).toContain('sent_at');
    });
  });

  describe('Weather Service (fetchForecast & parseForecast)', () => {
    const mockApiResponse = {
      daily: {
        precipitation_sum: [10.5, 5.0, 0.0],
        temperature_2m_max: [35.0, 39.0, 32.0],
        temperature_2m_min: [25.0, 26.0, 24.0],
      },
      hourly: {
        precipitation: [0.0, 0.0, 1.2, 0.0, 0.0, 0.0, 0.0, 0.0],
      },
    };

    beforeEach(() => {
      vi.resetAllMocks();
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should fetch and parse forecast data correctly', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      });

      const result = await fetchForecast(23.8103, 90.4125);

      expect(result).toEqual({
        today: { precip_mm: 10.5, temp_max: 35.0, temp_min: 25.0 },
        tomorrow: { precip_mm: 5.0, temp_max: 39.0, temp_min: 26.0 },
        next48h_precip_total: 15.5,
        rain_in_next_6h: true, // hourly index 2 has 1.2mm > 0.5mm
      });

      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('latitude=23.8103'));
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('longitude=90.4125'));
    });

    it('should retry up to 3 times on API failure', async () => {
      fetch.mockRejectedValue(new Error('Network error'));

      const promise = fetchForecast(23.8103, 90.4125);
      promise.catch(() => {}); // Prevent unhandled rejection warning

      // Fast-forward through all retries
      for (let i = 0; i < 3; i++) {
        await vi.runAllTimersAsync();
      }

      await expect(promise).rejects.toThrow('Network error');
      expect(fetch).toHaveBeenCalledTimes(3);
    });

    it('should handle API success on second attempt', async () => {
      fetch
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockApiResponse,
        });

      const promise = fetchForecast(23.8103, 90.4125);

      // Fast-forward through first retry delay
      await vi.runAllTimersAsync();

      const result = await promise;
      expect(fetch).toHaveBeenCalledTimes(2);
      expect(result.next48h_precip_total).toBe(15.5);
    });
  });

  describe('Irrigation Advisor Logic (Whapasa Rules)', () => {
    it('should skip irrigation if next 48h precipitation is > 5mm', () => {
      const forecast = {
        next48h_precip_total: 5.1,
        rain_in_next_6h: false,
        today: { temp_max: 30 },
      };
      const alerts = getIrrigationAdvice(forecast, 35);

      const skipAlert = alerts.find((a) => a.type === 'skip_irrigation');
      expect(skipAlert).toBeDefined();
      expect(skipAlert.severity).toBe('info');
      expect(skipAlert.message_bn).toContain('সেচ দেবেন না');
      expect(skipAlert.message_bn).toMatch(/[\u0980-\u09FF]/); // Bangla Unicode check
    });

    it('should NOT skip irrigation if next 48h precipitation is exactly 5mm', () => {
      const forecast = {
        next48h_precip_total: 5.0,
        rain_in_next_6h: false,
        today: { temp_max: 30 },
      };
      const alerts = getIrrigationAdvice(forecast, 35);

      expect(alerts.some((a) => a.type === 'skip_irrigation')).toBe(false);
    });

    it('should advise irrigation if soil is dry and no rain forecast', () => {
      const forecast = {
        next48h_precip_total: 2.0,
        rain_in_next_6h: false,
        today: { temp_max: 30 },
      };
      const alerts = getIrrigationAdvice(forecast, 35); // 35% < 40% threshold

      const irrigateAlert = alerts.find((a) => a.type === 'irrigate');
      expect(irrigateAlert).toBeDefined();
      expect(irrigateAlert.severity).toBe('warning');
      expect(irrigateAlert.message_bn).toContain('সেচ দিন');
    });

    it('should skip spray if rain is expected in next 6h', () => {
      const forecast = {
        next48h_precip_total: 2.0,
        rain_in_next_6h: true,
        today: { temp_max: 30 },
      };
      const alerts = getIrrigationAdvice(forecast, 50);

      const sprayAlert = alerts.find((a) => a.type === 'skip_spray');
      expect(sprayAlert).toBeDefined();
      expect(sprayAlert.severity).toBe('warning');
      expect(sprayAlert.message_bn).toContain('স্প্রে করবেন না');
    });

    it('should fire heat alert if temp_max > 38°C', () => {
      const forecast = {
        next48h_precip_total: 0,
        rain_in_next_6h: false,
        today: { temp_max: 38.1 },
      };
      const alerts = getIrrigationAdvice(forecast, 50);

      const heatAlert = alerts.find((a) => a.type === 'heat_alert');
      expect(heatAlert).toBeDefined();
      expect(heatAlert.severity).toBe('critical');
      expect(heatAlert.message_bn).toContain('তীব্র গরম');
    });

    it('should NOT fire heat alert if temp_max is exactly 38°C', () => {
      const forecast = {
        next48h_precip_total: 0,
        rain_in_next_6h: false,
        today: { temp_max: 38.0 },
      };
      const alerts = getIrrigationAdvice(forecast, 50);

      expect(alerts.some((a) => a.type === 'heat_alert')).toBe(false);
    });

    it('should return multiple alerts if conditions overlap', () => {
      const forecast = {
        next48h_precip_total: 10.0,
        rain_in_next_6h: true,
        today: { temp_max: 39.0 },
      };
      const alerts = getIrrigationAdvice(forecast, 50);

      const types = alerts.map((a) => a.type);
      expect(types).toContain('skip_irrigation');
      expect(types).toContain('skip_spray');
      expect(types).toContain('heat_alert');
    });
  });

  describe('Coordinate Deduplication Logic', () => {
    // This tests the logic intended for the scheduler/cron job
    it('should group plots by GPS coordinates correctly', () => {
      const plots = [
        { id: 1, latitude: 23.5, longitude: 90.1 },
        { id: 2, latitude: 23.5, longitude: 90.1 }, // Duplicate
        { id: 3, latitude: 24.0, longitude: 91.0 },
      ];

      const groupBy = (array, keyFn) =>
        array.reduce((acc, obj) => {
          const key = keyFn(obj);
          if (!acc[key]) acc[key] = [];
          acc[key].push(obj);
          return acc;
        }, {});

      const coordGroups = groupBy(plots, (p) => `${p.latitude},${p.longitude}`);

      expect(Object.keys(coordGroups)).toHaveLength(2);
      expect(coordGroups['23.5,90.1']).toHaveLength(2);
      expect(coordGroups['24,91']).toHaveLength(1);
    });
  });

  describe('Bangla Unicode Support', () => {
    it('should verify messages contain Bangla characters', () => {
      const forecast = {
        next48h_precip_total: 10.0,
        rain_in_next_6h: true,
        today: { temp_max: 40.0 },
      };
      const alerts = getIrrigationAdvice(forecast, 30);

      alerts.forEach((alert) => {
        expect(alert.message_bn).toMatch(/[\u0980-\u09FF]/);
        expect(alert.message_en).toBeDefined();
      });
    });
  });
});
