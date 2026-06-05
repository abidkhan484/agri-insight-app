import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerWeatherCommand } from '../bot/commands/weather.js';
import { registerReportCommand } from '../bot/commands/report.js';
import { dbService } from '../db/service.js';
import { fetchForecast } from '../services/weather.js';

// Mock logger
vi.mock('../config/logger.js', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

// Mock dbService
vi.mock('../db/service.js', () => ({
  dbService: {
    getFarmerByTelegramId: vi.fn(),
    getPlotsByFarmerIdFromTelegram: vi.fn(),
    getInputLogsByPlotAndMonth: vi.fn(),
    getObservationsByPlotAndMonth: vi.fn(),
    getHarvestsByPlotAndMonth: vi.fn(),
  },
}));

// Mock weather forecast service
vi.mock('../services/weather.js', () => ({
  fetchForecast: vi.fn(),
}));

describe('Weather and Report Commands', () => {
  let bot;
  let ctx;

  beforeEach(() => {
    vi.clearAllMocks();

    bot = {
      command: vi.fn((name, handler) => {
        bot.handlers = bot.handlers || {};
        bot.handlers[name] = handler;
      }),
    };

    ctx = {
      from: { id: 12345, first_name: 'Test Farmer' },
      message: { text: '' },
      reply: vi.fn().mockResolvedValue(true),
      replyWithMarkdown: vi.fn().mockResolvedValue(true),
    };
  });

  describe('/weather command', () => {
    it('should register weather command', () => {
      registerWeatherCommand(bot);
      expect(bot.command).toHaveBeenCalledWith('weather', expect.any(Function));
    });

    it('should block unregistered farmers', async () => {
      registerWeatherCommand(bot);
      dbService.getFarmerByTelegramId.mockResolvedValue(null);

      ctx.message.text = '/weather';
      await bot.handlers['weather'](ctx);

      expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('নিবন্ধিত নন'));
    });

    it('should return error if no plots registered', async () => {
      registerWeatherCommand(bot);
      dbService.getFarmerByTelegramId.mockResolvedValue({ id: 1, name: 'Test Farmer' });
      dbService.getPlotsByFarmerIdFromTelegram.mockResolvedValue([]);

      ctx.message.text = '/weather';
      await bot.handlers['weather'](ctx);

      expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('কোনো নিবন্ধিত জমি নেই'));
    });

    it('should return weather advice for plots with GPS', async () => {
      registerWeatherCommand(bot);
      dbService.getFarmerByTelegramId.mockResolvedValue({ id: 1, name: 'Test Farmer' });
      dbService.getPlotsByFarmerIdFromTelegram.mockResolvedValue([
        { id: 10, name: 'Field A', latitude: 23.8, longitude: 90.3 },
      ]);
      fetchForecast.mockResolvedValue({
        today: { temp_max: 30.2, temp_min: 24.8, precip_mm: 0 },
        tomorrow: { temp_max: 31.0, temp_min: 25.0, precip_mm: 12.0 },
        next48h_precip_total: 12.0,
        rain_in_next_6h: false,
      });

      ctx.message.text = '/weather';
      await bot.handlers['weather'](ctx);

      expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('সংগ্রহ করা হচ্ছে'));
      expect(fetchForecast).toHaveBeenCalledWith(23.8, 90.3);
      expect(ctx.replyWithMarkdown).toHaveBeenCalledWith(
        expect.stringContaining('সেচ দেবেন না'), // since precipitation total > 5mm
      );
    });
  });

  describe('/report command', () => {
    it('should register report command', () => {
      registerReportCommand(bot);
      expect(bot.command).toHaveBeenCalledWith('report', expect.any(Function));
    });

    it('should return farm report summary', async () => {
      registerReportCommand(bot);
      dbService.getFarmerByTelegramId.mockResolvedValue({ id: 1, name: 'Test Farmer' });
      dbService.getPlotsByFarmerIdFromTelegram.mockResolvedValue([{ id: 10, name: 'Field A' }]);

      dbService.getInputLogsByPlotAndMonth.mockResolvedValue([
        { type: 'Jeevamrutha', quantity: 200, quantity_unit: 'Liters', cost: 500 },
      ]);
      dbService.getObservationsByPlotAndMonth.mockResolvedValue([
        { title: 'Earthworms spotted', date: '2026-06-05' },
      ]);
      dbService.getHarvestsByPlotAndMonth.mockResolvedValue([
        { crop: 'Rice', quantity: 500, quantity_unit: 'Kg', revenue: 15000 },
      ]);

      ctx.message.text = '/report';
      await bot.handlers['report'](ctx);

      expect(ctx.replyWithMarkdown).toHaveBeenCalledWith(expect.stringContaining('Jeevamrutha'));
      expect(ctx.replyWithMarkdown).toHaveBeenCalledWith(
        expect.stringContaining('Earthworms spotted'),
      );
      expect(ctx.replyWithMarkdown).toHaveBeenCalledWith(expect.stringContaining('Rice'));
      expect(ctx.replyWithMarkdown).toHaveBeenCalledWith(
        expect.stringContaining('১৫,০০০'), // revenue formatted to Bangla digits
      );
    });
  });
});
