import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SyncManager } from '../SyncManager';

describe('SyncManager', () => {
  let mockDb;
  let mockSupabase;
  let syncManager;

  beforeEach(() => {
    mockDb = {
      plots: {
        filter: vi.fn().mockReturnThis(),
        toArray: vi.fn(),
        orderBy: vi.fn().mockReturnThis(),
        last: vi.fn(),
        update: vi.fn(),
        bulkUpdate: vi.fn(),
        bulkDelete: vi.fn(),
        get: vi.fn(),
        put: vi.fn(),
        delete: vi.fn()
      },
      transaction: vi.fn((mode, tables, callback) => callback())
    };

    const queryBuilder = {
      select: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis()
    };

    mockSupabase = {
      from: vi.fn().mockReturnValue(queryBuilder)
    };

    syncManager = new SyncManager(mockDb, mockSupabase, 'plots');
    
    // Inject mocks into the query builder for expectations
    mockSupabase.queryBuilder = queryBuilder;
  });

  it('should push dirty records to Supabase', async () => {
    const dirtyRecords = [
      { id: '1', name: 'Plot 1', sync_status: 'dirty' }
    ];
    mockDb.plots.toArray.mockResolvedValue(dirtyRecords);
    mockSupabase.queryBuilder.upsert.mockResolvedValue({ error: null });

    await syncManager.pushChanges();

    expect(mockSupabase.from).toHaveBeenCalledWith('plots');
    expect(mockSupabase.queryBuilder.upsert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ id: '1', is_deleted: false })
      ]),
      { onConflict: 'id' }
    );
    expect(mockDb.plots.update).toHaveBeenCalledWith('1', { sync_status: 'synced' });
  });

  it('should pull new records from Supabase', async () => {
    mockDb.plots.last.mockResolvedValue({ updated_at: '2024-05-20T10:00:00Z' });
    const remoteRecords = [
      { id: '2', name: 'Remote Plot', updated_at: '2024-05-20T11:00:00Z' }
    ];
    mockSupabase.queryBuilder.select.mockReturnThis();
    mockSupabase.queryBuilder.gt.mockResolvedValue({ data: remoteRecords, error: null });
    mockDb.plots.get.mockResolvedValue(null);

    await syncManager.pullChanges();

    expect(mockSupabase.queryBuilder.gt).toHaveBeenCalledWith('updated_at', '2024-05-20T10:00:00Z');
    expect(mockDb.plots.put).toHaveBeenCalledWith(
      expect.objectContaining({ id: '2', sync_status: 'synced' })
    );
  });
});
