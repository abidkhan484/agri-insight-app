import { describe, it, expect } from 'vitest';
import { config } from '../config/index.js';

describe('Config Loader', () => {
  it('should load default values', () => {
    expect(config.timezone).toBe('Asia/Dhaka');
    expect(config.logLevel).toBe('info');
    expect(['development', 'test']).toContain(config.nodeEnv); // vitest sets NODE_ENV to test
    expect(config.dbPath).toBeDefined();
  });
});
