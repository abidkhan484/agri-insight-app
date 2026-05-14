import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerAskCommand } from '../bot/commands/ask.js';

// Mock logger
vi.mock('../config/logger.js', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

// Mock fetch
global.fetch = vi.fn();

describe('/ask bot command', () => {
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
    };
    
    ctx = {
      from: { id: 12345, first_name: 'Test User' },
      message: { text: '/ask How to make Jeevamrutha?' },
      chat: { id: 67890 },
      reply: vi.fn().mockResolvedValue({ message_id: 111 }),
      telegram: {
        editMessageText: vi.fn().mockResolvedValue(true),
      },
    };
    
    db = {}; // Mock db if needed
  });

  it('should register the ask command', () => {
    registerAskCommand(bot, db);
    expect(bot.command).toHaveBeenCalledWith('ask', expect.any(Function));
  });

  it('should prompt for question if empty', async () => {
    registerAskCommand(bot, db);
    ctx.message.text = '/ask';
    await bot.handlers['ask'](ctx);
    
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('প্রশ্ন লিখুন'));
  });

  it('should reject questions longer than 500 characters', async () => {
    registerAskCommand(bot, db);
    ctx.message.text = '/ask ' + 'a'.repeat(501);
    await bot.handlers['ask'](ctx);
    
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('৫০০ অক্ষরের বেশি হবে না'));
  });

  it('should handle successful AI API response', async () => {
    registerAskCommand(bot, db);
    
    const mockApiResponse = {
      answer: 'Jeevamrutha is made with cow dung, urine, etc.',
      sources: ['zbnf-guide.md'],
      status: 'ok'
    };
    
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockApiResponse),
    });

    await bot.handlers['ask'](ctx);

    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('ভাবছি'));
    expect(global.fetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ question: 'How to make Jeevamrutha?', language: 'bn' }),
    }));
    
    expect(ctx.telegram.editMessageText).toHaveBeenCalledWith(
      ctx.chat.id,
      111,
      null,
      expect.stringContaining('Jeevamrutha is made with cow dung'),
      expect.objectContaining({ parse_mode: 'Markdown' })
    );
  });

  it('should handle API failure gracefully', async () => {
    registerAskCommand(bot, db);
    
    global.fetch.mockResolvedValue({
      ok: false,
      status: 500,
    });

    await bot.handlers['ask'](ctx);

    expect(ctx.telegram.editMessageText).toHaveBeenCalledWith(
      ctx.chat.id,
      111,
      null,
      expect.stringContaining('দুঃখিত')
    );
  });

  it('should handle network error/timeout gracefully', async () => {
    registerAskCommand(bot, db);
    
    global.fetch.mockRejectedValue(new Error('Network timeout'));

    await bot.handlers['ask'](ctx);

    expect(ctx.telegram.editMessageText).toHaveBeenCalledWith(
      ctx.chat.id,
      111,
      null,
      expect.stringContaining('দুঃখিত')
    );
  });
});
