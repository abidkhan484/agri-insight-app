import log from 'loglevel';
import { fromRemoteRecord, getRemoteTableName, toRemoteRecord } from './recordMapping';

log.setLevel(import.meta.env.PROD ? 'warn' : 'debug');
const RETRY_DELAY_MS = 1000;

export class SyncManager {
  constructor(dexieDb, supabaseClient, tableName, { user } = {}) {
    this.db = dexieDb;
    this.supabase = supabaseClient;
    this.tableName = tableName;
    this.remoteTableName = getRemoteTableName(tableName);
    this.user = user;
    this.isSyncing = false;
    this.retryCount = 0;
    this.lastError = null;
    this.lastSyncedAt = null;
  }

  getStatus() {
    return { syncing: this.isSyncing, error: this.lastError, retryCount: this.retryCount, lastSyncedAt: this.lastSyncedAt };
  }

  async sync() {
    if (this.isSyncing || !navigator.onLine) return false;
    this.isSyncing = true;
    try {
      await this.pushChanges();
      await this.pullChanges();
      this.retryCount = 0;
      this.lastError = null;
      this.lastSyncedAt = new Date();
      return true;
    } catch (error) {
      this.retryCount += 1;
      this.lastError = error;
      log.error(`Sync error for ${this.tableName}:`, error.message || error);
      throw error;
    } finally {
      this.isSyncing = false;
    }
  }

  async getFarmerId() {
    if (this.farmerId) return this.farmerId;
    if (!this.user?.token) throw new Error('Authenticated user is required for sync');
    const { data, error } = await this.supabase.from('farmers').select('id').limit(1).maybeSingle();
    if (error) throw error;
    if (!data?.id) throw new Error('Authenticated farmer record was not found');
    this.farmerId = data.id;
    return this.farmerId;
  }

  async getRemotePlotId(localPlotId) {
    const plot = await this.db.plots.get(localPlotId);
    if (!plot) throw new Error(`Local plot ${localPlotId} was not found`);
    if (plot.remote_id) return plot.remote_id;
    throw new Error(`Plot ${localPlotId} must sync before its records`);
  }

  async pushChanges() {
    const dirtyRecords = await this.db[this.tableName].filter(record => record.sync_status !== 'synced').toArray();
    if (dirtyRecords.length === 0) return;

    const farmerId = this.tableName === 'plots' ? await this.getFarmerId() : undefined;
    const payload = [];
    for (const record of dirtyRecords) {
      const plotRemoteId = this.tableName === 'plots' ? undefined : await this.getRemotePlotId(record.plotId);
      payload.push(toRemoteRecord(this.tableName, record, { farmerId, plotRemoteId }));
    }

    const query = this.supabase.from(this.remoteTableName);
    const response = dirtyRecords.some(record => !record.remote_id) && this.tableName === 'plots'
      ? await query.insert(payload).select('id, updated_at')
      : await query.upsert(payload, { onConflict: 'id' }).select('id, updated_at');
    if (response.error) throw response.error;

    const returned = response.data || [];
    await this.db.transaction('rw', this.db[this.tableName], async () => {
      for (let index = 0; index < dirtyRecords.length; index += 1) {
        const local = dirtyRecords[index];
        const remote = returned[index] || {};
        if (local.sync_status === 'deleted') {
          await this.db[this.tableName].bulkDelete([local.id]);
        } else {
          await this.db[this.tableName].update(local.id, {
            ...(remote.id ? { remote_id: remote.id } : {}),
            ...(remote.updated_at ? { updated_at: remote.updated_at } : {}),
            sync_status: 'synced',
          });
        }
      }
    });
  }

  async pullChanges() {
    const latestLocalRecord = await this.db[this.tableName].orderBy('updated_at').filter(record => record.sync_status === 'synced').last();
    const lastSyncTime = latestLocalRecord?.updated_at || new Date(0).toISOString();
    const { data: remoteRecords, error } = await this.supabase.from(this.remoteTableName).select('*').gt('updated_at', lastSyncTime);
    if (error) throw error;
    if (!remoteRecords?.length) return;

    await this.db.transaction('rw', this.db[this.tableName], async () => {
      for (const remote of remoteRecords) {
        const local = this.tableName === 'plots'
          ? await this.db[this.tableName].filter(record => record.remote_id === remote.id).first()
          : await this.db[this.tableName].get(remote.id);
        const shouldUpdate = !local || local.sync_status === 'synced' || new Date(remote.updated_at) > new Date(local.updated_at);
        if (!shouldUpdate) continue;
        if (remote.is_deleted) {
          if (local) await this.db[this.tableName].delete(local.id);
          continue;
        }
        let localPlotId;
        if (this.tableName !== 'plots') {
          const plot = await this.db.plots.filter(record => record.remote_id === remote.plot_id).first();
          localPlotId = plot?.id;
        }
        const next = fromRemoteRecord(this.tableName, remote, localPlotId);
        if (local) next.id = local.id;
        await this.db[this.tableName].put(next);
      }
    });
  }

  async retry() {
    if (this.retryCount > 0) {
      await new Promise(resolve => setTimeout(resolve, Math.min(RETRY_DELAY_MS * this.retryCount, 10000)));
    }
    return this.sync();
  }
}
