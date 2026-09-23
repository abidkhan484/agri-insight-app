import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SyncManager } from '../SyncManager';
import { toRemoteRecord } from '../recordMapping';

const makeCollection = () => ({
  filter: vi.fn().mockReturnThis(),
  toArray: vi.fn().mockResolvedValue([]),
  orderBy: vi.fn().mockReturnThis(),
  last: vi.fn().mockResolvedValue(null),
  first: vi.fn().mockResolvedValue(null),
  get: vi.fn(),
  update: vi.fn(),
  bulkDelete: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
});

describe('SyncManager', () => {
  let mockDb;
  let mockSupabase;
  let queryBuilder;

  beforeEach(() => {
    mockDb = {
      plots: makeCollection(),
      inputs: makeCollection(),
      observations: makeCollection(),
      harvests: makeCollection(),
      transaction: vi.fn((mode, table, callback) => callback()),
    };
    queryBuilder = {
      select: vi.fn().mockReturnThis(),
      gt: vi.fn().mockResolvedValue({ data: [], error: null }),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { id: 7 }, error: null }),
      insert: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
    };
    mockSupabase = { from: vi.fn().mockReturnValue(queryBuilder) };
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });
  });

  it('maps local input records to the canonical input_logs contract', () => {
    expect(toRemoteRecord('inputs', {
      id: 'local-input', plotId: 'local-plot', date: '2026-09-23', type: 'Jeevamrutha',
      quantity: 20, quantityUnit: 'litre', cost: 0, sync_status: 'dirty',
    }, { plotRemoteId: 41 })).toEqual(expect.objectContaining({
      plot_id: 41, quantity_unit: 'litre', is_deleted: false,
    }));
    expect(toRemoteRecord('inputs', { plotId: 'local-plot' }, { plotRemoteId: 41 })).not.toHaveProperty('quantityUnit');
  });

  it('pushes a new plot with ownership and stores the remote id bridge', async () => {
    const localPlot = { id: 'local-plot', name: 'North field', area: 33, sync_status: 'dirty' };
    mockDb.plots.filter().toArray.mockResolvedValue([localPlot]);
    queryBuilder.insert.mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: [{ id: 42, updated_at: '2026-09-23T00:00:00Z' }], error: null }),
    });

    const manager = new SyncManager(mockDb, mockSupabase, 'plots', { user: { token: 'jwt' } });
    await manager.pushChanges();

    expect(mockSupabase.from).toHaveBeenCalledWith('farmers');
    expect(mockSupabase.from).toHaveBeenCalledWith('plots');
    expect(queryBuilder.insert).toHaveBeenCalledWith([
      expect.objectContaining({ farmer_id: 7, area_decimal: 33, is_deleted: false }),
    ]);
    expect(mockDb.plots.update).toHaveBeenCalledWith('local-plot', expect.objectContaining({
      remote_id: 42, sync_status: 'synced',
    }));
  });

  it('uses input_logs and preserves dirty records when the remote push fails', async () => {
    const localInput = { id: 'input-1', plotId: 'local-plot', sync_status: 'dirty' };
    mockDb.inputs.filter().toArray.mockResolvedValue([localInput]);
    mockDb.plots.get.mockResolvedValue({ id: 'local-plot', remote_id: 42 });
    queryBuilder.upsert.mockReturnValue({
      select: vi.fn().mockResolvedValue({ error: new Error('network failure') }),
    });

    const manager = new SyncManager(mockDb, mockSupabase, 'inputs', { user: { token: 'jwt' } });
    await expect(manager.sync()).rejects.toThrow('network failure');
    expect(mockSupabase.from).toHaveBeenCalledWith('input_logs');
    expect(mockDb.inputs.update).not.toHaveBeenCalled();
    expect(manager.getStatus()).toEqual(expect.objectContaining({ retryCount: 1, error: expect.any(Error) }));
  });

  it('pulls remote plots while preserving a local UUID', async () => {
    queryBuilder.gt.mockResolvedValue({
      data: [{ id: 42, name: 'Remote field', area_decimal: 12, updated_at: '2026-09-23T01:00:00Z' }],
      error: null,
    });
    mockDb.plots.orderBy().filter().last.mockResolvedValue({ updated_at: '2026-09-23T00:00:00Z' });
    mockDb.plots.filter().first.mockResolvedValue(null);

    const manager = new SyncManager(mockDb, mockSupabase, 'plots', { user: { token: 'jwt' } });
    await manager.pullChanges();

    expect(mockSupabase.from).toHaveBeenCalledWith('plots');
    expect(mockDb.plots.put).toHaveBeenCalledWith(expect.objectContaining({
      remote_id: 42, area: 12, sync_status: 'synced',
    }));
  });
});
