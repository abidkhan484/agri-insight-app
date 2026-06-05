import { vi } from 'vitest';

// Define dummy environment variables for tests so config loading does not warn/fail
process.env.BOT_TOKEN = process.env.BOT_TOKEN || '123456789:AAF-fake-bot-token-for-testing';
process.env.VITE_SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || 'https://fake-supabase-url.supabase.co';
process.env.SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_KEY || 'fake-supabase-service-role-key-for-testing';
process.env.SUPABASE_JWT_SECRET =
  process.env.SUPABASE_JWT_SECRET || 'fake-supabase-jwt-secret-at-least-32-characters-long';
process.env.VITE_BASE_URL = process.env.VITE_BASE_URL || '/';

// Mock @supabase/supabase-js globally to prevent actual network/WebSocket connection attempts during tests
vi.mock('@supabase/supabase-js', () => {
  const mockSupabase = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
    then: vi.fn().mockImplementation((onfulfilled) => {
      return Promise.resolve(onfulfilled({ data: [], error: null }));
    }),
  };

  return {
    createClient: vi.fn(() => mockSupabase),
  };
});
