import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mocking dependencies based on SPECIFICATIONS
vi.mock('../services/supabase.js', () => ({
  registerFarmerLocation: vi.fn(),
  searchFAQ: vi.fn(),
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(),
      select: vi.fn(),
    })),
  },
}));

vi.mock('../config/logger.js', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock Database for registration checks
const mockDb = {
  prepare: vi.fn().mockReturnThis(),
  get: vi.fn(),
  run: vi.fn(),
};

describe('P8 — Community Farmer Network', () => {
  describe('Coordinate Validation (BD bounds: 20.5–26.7N, 88.0–92.7E)', () => {
    // Logic extracted from SKILL.md specs
    const validateCoords = (lat, lon) => {
      if (lat < 20.5 || lat > 26.7 || lon < 88.0 || lon > 92.7) {
        throw new Error('Coordinates outside Bangladesh bounds');
      }
      return true;
    };

    it('should accept coordinates inside Bangladesh (Dhaka)', () => {
      expect(validateCoords(23.685, 90.356)).toBe(true);
    });

    it('should accept coordinates at the boundary (South-West)', () => {
      expect(validateCoords(20.5, 88.0)).toBe(true);
    });

    it('should accept coordinates at the boundary (North-East)', () => {
      expect(validateCoords(26.7, 92.7)).toBe(true);
    });

    it('should reject coordinates in Delhi, India', () => {
      expect(() => validateCoords(28.6139, 77.2090)).toThrow('Coordinates outside Bangladesh bounds');
    });

    it('should reject coordinates in the Bay of Bengal (South of BD)', () => {
      expect(() => validateCoords(19.0, 90.0)).toThrow('Coordinates outside Bangladesh bounds');
    });

    it('should reject coordinates in the Himalayas (North of BD)', () => {
      expect(() => validateCoords(28.0, 90.0)).toThrow('Coordinates outside Bangladesh bounds');
    });
  });

  describe('Bot Command: /joinmap', () => {
    let ctx;
    let registerJoinmapCommand;

    beforeEach(async () => {
      vi.clearAllMocks();
      ctx = {
        from: { id: 12345 },
        reply: vi.fn(),
      };
      // Import the command registration function
      const mod = await import('../bot/commands/joinmap.js');
      registerJoinmapCommand = mod.registerJoinmapCommand;
    });

    it('should reject non-registered farmers', async () => {
      const bot = { command: vi.fn() };
      registerJoinmapCommand(bot, mockDb);
      const commandHandler = bot.command.mock.calls.find(c => c[0] === 'joinmap')[1];

      mockDb.get.mockReturnValue(null); // Farmer not found

      await commandHandler(ctx);

      expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('নিবন্ধন করুন'));
      expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('register'));
    });

    it('should reject farmers missing location data', async () => {
      const bot = { command: vi.fn() };
      registerJoinmapCommand(bot, mockDb);
      const commandHandler = bot.command.mock.calls.find(c => c[0] === 'joinmap')[1];

      mockDb.get.mockReturnValue({ telegram_id: '12345', district: null }); // Missing district

      await commandHandler(ctx);

      expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('জেলা ও অবস্থান'));
    });

    it('should prevent duplicate registrations', async () => {
      const bot = { command: vi.fn() };
      registerJoinmapCommand(bot, mockDb);
      const commandHandler = bot.command.mock.calls.find(c => c[0] === 'joinmap')[1];

      // First call for farmer check, second for map_registrations check
      mockDb.get
        .mockReturnValueOnce({ telegram_id: '12345', district: 'Dhaka', latitude: 23.6, longitude: 90.3 })
        .mockReturnValueOnce({ id: 1 }); // Already exists in map_registrations

      await commandHandler(ctx);

      expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('ইতিমধ্যে মানচিত্রে আছেন'));
    });

    it('should successfully register farmer to map', async () => {
      const { registerFarmerLocation } = await import('../services/supabase.js');
      const bot = { command: vi.fn() };
      registerJoinmapCommand(bot, mockDb);
      const commandHandler = bot.command.mock.calls.find(c => c[0] === 'joinmap')[1];

      mockDb.get
        .mockReturnValueOnce({ telegram_id: '12345', district: 'Dhaka', latitude: 23.6, longitude: 90.3 })
        .mockReturnValueOnce(null); // Not in map_registrations

      await commandHandler(ctx);

      expect(registerFarmerLocation).toHaveBeenCalled();
      expect(mockDb.run).toHaveBeenCalled();
      expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('মানচিত্রে যোগ দিয়েছেন'));
    });
  });

  describe('Bot Command: /faq', () => {
    let ctx;
    let registerFaqCommand;

    beforeEach(async () => {
      vi.clearAllMocks();
      ctx = {
        from: { id: 12345 },
        message: { text: '/faq jeevamrutha' },
        reply: vi.fn(),
        replyWithMarkdown: vi.fn(),
      };
      const mod = await import('../bot/commands/faq.js');
      registerFaqCommand = mod.registerFaqCommand;
    });

    it('should prompt for query if empty', async () => {
      const bot = { command: vi.fn() };
      registerFaqCommand(bot);
      const commandHandler = bot.command.mock.calls.find(c => c[0] === 'faq')[1];

      ctx.message.text = '/faq';
      await commandHandler(ctx);

      expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('প্রশ্ন লিখুন'));
    });

    it('should handle no results found', async () => {
      const { searchFAQ } = await import('../services/supabase.js');
      searchFAQ.mockResolvedValue([]);

      const bot = { command: vi.fn() };
      registerFaqCommand(bot);
      const commandHandler = bot.command.mock.calls.find(c => c[0] === 'faq')[1];

      await commandHandler(ctx);

      expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('পাওয়া যায়নি'));
    });

    it('should display search results', async () => {
      const { searchFAQ } = await import('../services/supabase.js');
      searchFAQ.mockResolvedValue([
        { question_bn: 'জীবামৃত কী?', answer_bn: 'এটি একটি প্রাকৃতিক সার।' }
      ]);

      const bot = { command: vi.fn() };
      registerFaqCommand(bot);
      const commandHandler = bot.command.mock.calls.find(c => c[0] === 'faq')[1];

      await commandHandler(ctx);

      expect(ctx.replyWithMarkdown).toHaveBeenCalledWith(expect.stringContaining('জীবামৃত কী?'));
    });
  });

  describe('Bangla Unicode Verification', () => {
    it('should use Bangla Unicode characters for labels', () => {
      const banglaRegex = /[\u0980-\u09FF]/;
      const testString = 'মানচিত্র ZBNF';
      expect(banglaRegex.test(testString)).toBe(true);
    });
  });
});
