import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerCommunityCommands } from '../bot/commands/community.js';

// Mock logger
vi.mock('../config/logger.js', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('Community Bot Commands', () => {
  let bot;
  let ctx;
  let db;

  beforeEach(() => {
    vi.clearAllMocks();

    bot = {
      command: vi.fn((name, handler) => {
        bot.handlers = bot.handlers || {};
        bot.handlers[name] = handler;
      }),
      telegram: {
        sendMessage: vi.fn().mockResolvedValue(true),
      },
    };

    ctx = {
      from: { id: 12345, first_name: 'Test Farmer' },
      message: { text: '' },
      chat: { id: 67890 },
      reply: vi.fn().mockResolvedValue(true),
      replyWithMarkdown: vi.fn().mockResolvedValue(true),
    };

    db = {
      prepare: vi.fn().mockReturnValue({
        get: vi.fn(),
        run: vi.fn(),
        all: vi.fn(),
      }),
    };
  });

  it('should register community commands', () => {
    registerCommunityCommands(bot, db);
    expect(bot.command).toHaveBeenCalledWith('registercow', expect.any(Function));
    expect(bot.command).toHaveBeenCalledWith('findcow', expect.any(Function));
    expect(bot.command).toHaveBeenCalledWith('reportpest', expect.any(Function));
  });

  it('should allow a registered farmer to register a cow', async () => {
    registerCommunityCommands(bot, db);
    db.prepare().get.mockReturnValue({ id: 1, telegram_id: '12345' });

    await bot.handlers['registercow'](ctx);

    expect(db.prepare).toHaveBeenCalledWith(expect.stringContaining('UPDATE farmers SET has_desi_cow = 1'));
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('নিবন্ধিত হয়েছেন'));
  });

  it('should find cow suppliers in a district', async () => {
    registerCommunityCommands(bot, db);
    ctx.message.text = '/findcow Dhaka';
    db.prepare().all.mockReturnValue([
      { name: 'Karim', district: 'Dhaka', upazila: 'Savar' }
    ]);

    await bot.handlers['findcow'](ctx);

    expect(db.prepare).toHaveBeenCalledWith(expect.stringContaining('WHERE has_desi_cow = 1 AND district LIKE ?'));
    expect(ctx.replyWithMarkdown).toHaveBeenCalledWith(expect.stringContaining('Karim'));
  });

  it('should broadcast pest alerts to neighbors', async () => {
    registerCommunityCommands(bot, db);
    ctx.message.text = '/reportpest BPH spotted';
    db.prepare().get.mockReturnValue({ id: 1, telegram_id: '12345', upazila: 'Savar' });
    db.prepare().all.mockReturnValue([
      { telegram_id: '99999' }
    ]);

    await bot.handlers['reportpest'](ctx);

    expect(bot.telegram.sendMessage).toHaveBeenCalledWith('99999', expect.stringContaining('BPH spotted'), expect.any(Object));
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('পাঠানো হয়েছে'));
  });
});
