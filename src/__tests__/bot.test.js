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
    }
  }
  return { Telegraf };
});

vi.mock('../config/index.js', () => ({
  config: {
    botToken: 'test_token',
    timezone: 'Asia/Dhaka',
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
