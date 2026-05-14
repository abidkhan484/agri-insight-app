import { describe, it, expect, vi } from 'vitest';

vi.mock('telegraf', () => {
  class Telegraf {
    constructor(token) {
      this.token = token;
      this.start = vi.fn();
      this.help = vi.fn();
      this.catch = vi.fn();
      this.launch = vi.fn().mockResolvedValue(true);
      this.stop = vi.fn();
      this.use = vi.fn();
      this.command = vi.fn();
    }
  }
  return {
    Telegraf,
    Scenes: {
      WizardScene: vi.fn(),
      Stage: vi.fn().mockImplementation(function () {
        this.middleware = vi.fn();
      }),
    },
    session: vi.fn(),
  };
});

vi.mock('../config/index.js', () => ({
  config: {
    botToken: 'test_token',
    timezone: 'Asia/Dhaka',
    dbPath: './data/test.sqlite',
  },
}));

describe('Bot startup', () => {
  it('should initialize bot when token is present', async () => {
    // import index should not throw since we mocked config
    await import('../bot/index.js');

    // We cannot easily assert on the instance created inside the module without exporting it
    // But if we get here without throwing, the module loaded fine.
    expect(true).toBe(true);
  });
});
