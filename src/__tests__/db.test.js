import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { dirname, join } from 'path';
import { rmSync } from 'fs';
import { fileURLToPath } from 'url';

// Mock the config so db uses test path
vi.mock('../config/index.js', () => {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  return {
    config: {
      dbPath: join(__dirname, '../data/test-agri-app.sqlite'),
      supabaseUrl: 'https://example.supabase.co',
      supabaseKey: 'fake-key',
      supabaseJwtSecret: 'fake-secret',
    },
  };
});

describe('App Database Module', () => {
  let dbModule;

  beforeAll(async () => {
    // This will import the connection.js using the mocked config dbPath
    dbModule = await import('../db/connection.js');
  });

  afterAll(async () => {
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const testDbPath = join(__dirname, '../data/test-agri-app.sqlite');
    rmSync(testDbPath, { force: true });
  });

  it('should create database connection successfully from the app module', () => {
    expect(dbModule.default).toBeDefined();
    expect(dbModule.default.from).toBeTypeOf('function');
  });
});
