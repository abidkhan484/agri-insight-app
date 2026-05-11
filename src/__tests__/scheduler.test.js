import { describe, it, expect, vi, beforeEach } from 'vitest';
import cron from 'node-cron';
import { registerJob } from '../scheduler/index.js';

vi.mock('node-cron', () => ({
  default: {
    schedule: vi.fn(),
  },
}));

describe('Scheduler Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should register a job with cron.schedule', () => {
    const handler = vi.fn();
    registerJob('Test Job', '0 6 * * *', handler);

    expect(cron.schedule).toHaveBeenCalledWith('0 6 * * *', expect.any(Function));
  });
});
