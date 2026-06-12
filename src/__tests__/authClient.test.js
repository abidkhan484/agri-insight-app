/**
 * Tests for src/db/authClient.js
 *
 * Security fixture: authClient must ALWAYS pass config.supabaseAnonKey
 * to createClient — never config.supabaseKey (service-role key).
 *
 * Because authClient.js executes side-effects at module level (createClient
 * call + conditional logger.warn), every test resets the module registry
 * with vi.resetModules(), then injects fresh mocks via vi.doMock(), and
 * finally re-imports the module under test via a dynamic import().
 *
 * vi.isolateModules() was removed in Vitest 3+; this file targets Vitest 4.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';

// ── helpers ──────────────────────────────────────────────────────────────────

/**
 * Reset module registry, register mocks, then fresh-import authClient.
 *
 * @param {object} configOverride  Partial config values to inject
 * @returns {{ createClientMock: vi.Mock, warnMock: vi.Mock }}
 */
async function loadAuthClient(configOverride = {}) {
  // 1. Wipe the module cache so each test gets a fresh evaluation
  vi.resetModules();

  // 2. Define mock return values BEFORE importing the module under test
  const createClientMock = vi.fn(() => ({}));
  const warnMock = vi.fn();

  // 3. Mock Supabase SDK
  vi.doMock('@supabase/supabase-js', () => ({
    createClient: createClientMock,
  }));

  // 4. Mock Winston logger
  vi.doMock('../config/logger.js', () => ({
    default: {
      warn: warnMock,
      info: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    },
  }));

  // 5. Mock config with controllable values
  const baseConfig = {
    supabaseUrl: 'https://test.supabase.co',
    supabaseAnonKey: 'test-anon-key-123',
    supabaseKey: 'SHOULD-NOT-BE-USED-service-role-key', // must never reach createClient
  };
  vi.doMock('../config/index.js', () => ({
    config: { ...baseConfig, ...configOverride },
  }));

  // 6. Import the module under test — side-effects fire here
  await import('../db/authClient.js');

  return { createClientMock, warnMock };
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe('authClient.js — security: anon key usage', () => {
  afterEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  // ── 1. Happy path ───────────────────────────────────────────────────────────

  it('calls createClient with supabaseAnonKey, not supabaseKey', async () => {
    const { createClientMock } = await loadAuthClient({
      supabaseUrl: 'https://example.supabase.co',
      supabaseAnonKey: 'correct-anon-key',
      supabaseKey: 'dangerous-service-role-key',
    });

    expect(createClientMock).toHaveBeenCalledOnce();

    const [urlArg, keyArg] = createClientMock.mock.calls[0];
    expect(urlArg).toBe('https://example.supabase.co');

    // Must be the ANON key
    expect(keyArg).toBe('correct-anon-key');

    // Must NOT be the service-role key
    expect(keyArg).not.toBe('dangerous-service-role-key');
    expect(keyArg).not.toContain('service-role');
  });

  it('passes persistSession: false in client options', async () => {
    const { createClientMock } = await loadAuthClient({
      supabaseUrl: 'https://example.supabase.co',
      supabaseAnonKey: 'anon-key',
    });

    const [, , options] = createClientMock.mock.calls[0];
    expect(options).toMatchObject({ auth: { persistSession: false } });
  });

  it('does NOT call logger.warn when both url and anonKey are present', async () => {
    const { warnMock } = await loadAuthClient({
      supabaseUrl: 'https://example.supabase.co',
      supabaseAnonKey: 'anon-key',
    });

    expect(warnMock).not.toHaveBeenCalled();
  });

  // ── 2. Missing anon key ─────────────────────────────────────────────────────

  it('calls logger.warn (not throw) when supabaseAnonKey is undefined', async () => {
    const { warnMock, createClientMock } = await loadAuthClient({
      supabaseUrl: 'https://example.supabase.co',
      supabaseAnonKey: undefined,
    });

    // Must warn, not crash
    expect(warnMock).toHaveBeenCalledOnce();

    // Warn message must mention VITE_SUPABASE_ANON_KEY
    const [message] = warnMock.mock.calls[0];
    expect(message).toMatch(/VITE_SUPABASE_ANON_KEY/i);

    // createClient still called (module loaded without throwing)
    expect(createClientMock).toHaveBeenCalledOnce();
  });

  it('includes structured context { supabaseUrl, supabaseAnonKey } in the warn call', async () => {
    const { warnMock } = await loadAuthClient({
      supabaseUrl: 'https://example.supabase.co',
      supabaseAnonKey: undefined,
    });

    const [, context] = warnMock.mock.calls[0];
    expect(context).toBeDefined();
    expect(context).toHaveProperty('supabaseUrl');
    expect(context).toHaveProperty('supabaseAnonKey');
    // Values must be booleans (no raw secrets logged)
    expect(typeof context.supabaseUrl).toBe('boolean');
    expect(typeof context.supabaseAnonKey).toBe('boolean');
  });

  it('calls logger.warn when supabaseUrl is missing', async () => {
    const { warnMock } = await loadAuthClient({
      supabaseUrl: undefined,
      supabaseAnonKey: 'anon-key',
    });

    expect(warnMock).toHaveBeenCalledOnce();
  });

  // ── 3. Key isolation: service-role key never leaks ─────────────────────────

  it('never passes supabaseKey (service-role) as the second arg to createClient', async () => {
    const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.service-role-payload';

    const { createClientMock } = await loadAuthClient({
      supabaseUrl: 'https://example.supabase.co',
      supabaseAnonKey: 'correct-anon-key',
      supabaseKey: SERVICE_ROLE_KEY,
    });

    const calls = createClientMock.mock.calls;
    const allSecondArgs = calls.map(([, key]) => key);

    // None of the createClient calls should ever receive the service-role key
    expect(allSecondArgs).not.toContain(SERVICE_ROLE_KEY);
  });
});
