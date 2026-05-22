/* global Blob */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  handleDiseaseEnter,
  handleDiseaseCancel,
  handleDiseasePhoto,
} from '../bot/commands/disease.js';
import { dbService } from '../db/service.js';

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
  },
}));

// Mock config
vi.mock('../config/index.js', () => ({
  config: {
    plantnetApiKey: 'mock_plantnet_key',
  },
}));

describe('/disease Telegraf Scene Handlers', () => {
  let ctx;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    global.fetch = vi.fn();

    ctx = {
      from: { id: 12345 },
      chat: { id: 67890 },
      reply: vi.fn().mockResolvedValue(true),
      telegram: {
        getFileLink: vi
          .fn()
          .mockResolvedValue(new URL('https://api.telegram.org/file/bot123/photo.jpg')),
        editMessageText: vi.fn().mockResolvedValue(true),
      },
      scene: {
        leave: vi.fn(),
        current: { id: 'DISEASE_SCENE' },
        state: {},
      },
      message: {},
    };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should reject unregistered farmers on enter', async () => {
    dbService.getFarmerByTelegramId.mockResolvedValue(null);

    await handleDiseaseEnter(ctx);

    expect(dbService.getFarmerByTelegramId).toHaveBeenCalledWith('12345');
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('নিবন্ধিত নন'));
    expect(ctx.scene.leave).toHaveBeenCalled();
  });

  it('should accept registered farmers on enter and set timeout', async () => {
    dbService.getFarmerByTelegramId.mockResolvedValue({ id: 'f-1', name: 'Karim' });

    await handleDiseaseEnter(ctx);

    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('আক্রান্ত পাতার ছবি পাঠান'));
    expect(ctx.scene.state.timeoutId).toBeDefined();

    // Fast-forward 60s to trigger timeout
    await vi.runAllTimersAsync();
    expect(ctx.reply).toHaveBeenLastCalledWith(
      expect.stringContaining('রোগ শনাক্তকরণ বাতিল করা হয়েছে'),
    );
    expect(ctx.scene.leave).toHaveBeenCalled();
  });

  it('should handle cancel command', async () => {
    await handleDiseaseCancel(ctx);

    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('শনাক্তকরণ বাতিল করা হয়েছে'));
    expect(ctx.scene.leave).toHaveBeenCalled();
  });

  it('should handle successful disease identification and mapping', async () => {
    ctx.message = {
      photo: [
        { file_id: 'p-1', width: 100, height: 100 },
        { file_id: 'p-2', width: 800, height: 800 },
      ],
    };

    // Mock Telegram photo download
    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        blob: () => Promise.resolve(new Blob(['photo-data'], { type: 'image/jpeg' })),
      }),
    );

    // Mock PlantNet API identification (Rice Blast / Alternaria)
    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            results: [
              {
                score: 0.85,
                species: {
                  scientificNameWithoutAuthor: 'Alternaria solani',
                },
              },
            ],
          }),
      }),
    );

    await handleDiseasePhoto(ctx);

    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('বিশ্লেষণ করা হচ্ছে'));
    expect(ctx.telegram.getFileLink).toHaveBeenCalledWith('p-2');

    expect(ctx.telegram.editMessageText).toHaveBeenCalledWith(
      ctx.chat.id,
      undefined,
      null,
      expect.stringContaining('অলটারনারিয়া পাতার দাগ'),
      expect.objectContaining({ parse_mode: 'Markdown' }),
    );

    // Check Bangla confidence digit translation (85% -> ৮৫%)
    expect(ctx.telegram.editMessageText).toHaveBeenCalledWith(
      ctx.chat.id,
      undefined,
      null,
      expect.stringContaining('৮৫%'),
      expect.any(Object),
    );

    expect(ctx.scene.leave).toHaveBeenCalled();
  });

  it('should handle unknown disease identify mapping properly', async () => {
    ctx.message = {
      photo: [{ file_id: 'p-1' }],
    };

    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        blob: () => Promise.resolve(new Blob(['photo-data'])),
      }),
    );

    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            results: [
              {
                score: 0.9,
                species: {
                  scientificNameWithoutAuthor: 'Exoticus planticus',
                },
              },
            ],
          }),
      }),
    );

    await handleDiseasePhoto(ctx);

    expect(ctx.telegram.editMessageText).toHaveBeenCalledWith(
      ctx.chat.id,
      undefined,
      null,
      expect.stringContaining('Exoticus planticus'),
      expect.objectContaining({ parse_mode: 'Markdown' }),
    );

    expect(ctx.telegram.editMessageText).toHaveBeenCalledWith(
      ctx.chat.id,
      undefined,
      null,
      expect.stringContaining('নির্দিষ্ট ZBNF প্রতিকার উপলব্ধ নেই'),
      expect.any(Object),
    );
  });

  it('should handle low confidence no-match case', async () => {
    ctx.message = {
      photo: [{ file_id: 'p-1' }],
    };

    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        blob: () => Promise.resolve(new Blob(['photo-data'])),
      }),
    );

    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            results: [
              {
                score: 0.15, // 15% confidence (under 20% threshold)
                species: {
                  scientificNameWithoutAuthor: 'Alternaria',
                },
              },
            ],
          }),
      }),
    );

    await handleDiseasePhoto(ctx);

    expect(ctx.telegram.editMessageText).toHaveBeenCalledWith(
      ctx.chat.id,
      undefined,
      null,
      expect.stringContaining('রোগ শনাক্ত করা যায়নি'),
    );
  });

  it('should handle PlantNet API errors gracefully', async () => {
    ctx.message = {
      photo: [{ file_id: 'p-1' }],
    };

    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        blob: () => Promise.resolve(new Blob(['photo-data'])),
      }),
    );

    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        status: 500,
      }),
    );

    await handleDiseasePhoto(ctx);

    expect(ctx.telegram.editMessageText).toHaveBeenCalledWith(
      ctx.chat.id,
      undefined,
      null,
      expect.stringContaining('সার্ভারে সমস্যা'),
    );
  });
});
