import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { config } from '../config/index.js';

describe('Config Loader', () => {
  it('should load default values', () => {
    expect(config.timezone).toBe('Asia/Dhaka');
    expect(config.logLevel).toBe('info');
    expect(['development', 'test']).toContain(config.nodeEnv); // vitest sets NODE_ENV to test
    expect(config.dbPath).toBeDefined();
  });

  describe('VITE_SUPABASE_ANON_KEY unification', () => {
    const ORIG_ENV = process.env;

    beforeEach(() => {
      // Clone env so mutations don't bleed between tests
      process.env = { ...ORIG_ENV };
      // Reset module registry so config/index.js re-evaluates with the
      // current process.env on each dynamic import() call.
      // (The ?t=Date.now() URL trick was removed in Vitest 3+.)
      vi.resetModules();
      // Stub dotenv so the on-disk .env file cannot re-inject values and
      // override the controlled process.env we set in each test.
      vi.doMock('dotenv', () => ({ default: { config: vi.fn() }, config: vi.fn() }));
    });

    afterEach(() => {
      process.env = ORIG_ENV;
      vi.resetModules();
    });

    it('supabaseAnonKey reads VITE_SUPABASE_ANON_KEY, not bare SUPABASE_ANON_KEY', async () => {
      // Set only the VITE_ prefixed var
      process.env.VITE_SUPABASE_ANON_KEY = 'test-vite-anon-key';
      delete process.env.SUPABASE_ANON_KEY; // old bare key must NOT be used

      // Re-import to get a fresh config bound to the updated env
      const { config: freshConfig } = await import('../config/index.js');
      expect(freshConfig.supabaseAnonKey).toBe('test-vite-anon-key');
    });

    it('supabaseAnonKey is undefined when only bare SUPABASE_ANON_KEY is set', async () => {
      delete process.env.VITE_SUPABASE_ANON_KEY;
      process.env.SUPABASE_ANON_KEY = 'bare-old-key'; // should be ignored

      const { config: freshConfig } = await import('../config/index.js');
      // If config correctly uses ONLY VITE_SUPABASE_ANON_KEY, this must be undefined
      expect(freshConfig.supabaseAnonKey).toBeUndefined();
    });
  });
});
