/**
 * SyncManager handles bidirectional synchronization between a local Dexie database
 * and a remote Supabase instance.
 */
import log from 'loglevel';

log.setLevel(import.meta.env.PROD ? 'warn' : 'debug');

export class SyncManager {
  constructor(dexieDb, supabaseClient, tableName) {
    this.db = dexieDb;
    this.supabase = supabaseClient;
    this.tableName = tableName;
    this.isSyncing = false;
  }

  /**
   * Main sync loop: Push local changes, then Pull remote changes.
   */
  async sync() {
    if (this.isSyncing || !navigator.onLine) return;
    this.isSyncing = true;

    try {
      await this.pushChanges();
      await this.pullChanges();
    } catch (error) {
      log.error(`Sync error for ${this.tableName}:`, error);
      throw error;
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Finds local 'dirty' or 'deleted' records and upserts them to Supabase.
   */
  async pushChanges() {
    const dirtyRecords = await this.db[this.tableName]
      .filter(record => record.sync_status !== 'synced')
      .toArray();

    if (dirtyRecords.length === 0) return;

    // Map to Supabase format (strip local sync_status)
    const payload = dirtyRecords.map(({ sync_status, ...rest }) => ({
      ...rest,
      // Ensure updated_at is refreshed on push
      updated_at: new Date().toISOString(),
      is_deleted: sync_status === 'deleted'
    }));

    const { error } = await this.supabase
      .from(this.tableName)
      .upsert(payload, { onConflict: 'id' });

    if (error) throw error;

    // Clean up local DB
    const syncedIds = dirtyRecords.filter(r => r.sync_status === 'dirty').map(r => r.id);
    const deletedIds = dirtyRecords.filter(r => r.sync_status === 'deleted').map(r => r.id);

    await this.db.transaction('rw', this.db[this.tableName], async () => {
      if (syncedIds.length > 0) {
        await Promise.all(syncedIds.map(id => 
          this.db[this.tableName].update(id, { sync_status: 'synced' })
        ));
      }
      if (deletedIds.length > 0) {
        await this.db[this.tableName].bulkDelete(deletedIds);
      }
    });
  }

  /**
   * Fetches remote changes modified after the latest local record's updated_at.
   */
  async pullChanges() {
    // Find latest synced record to determine watermark
    const latestLocalRecord = await this.db[this.tableName]
      .filter(r => r.sync_status === 'synced')
      .orderBy('updated_at')
      .last();
    
    const lastSyncTime = latestLocalRecord ? latestLocalRecord.updated_at : new Date(0).toISOString();

    const { data: remoteRecords, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .gt('updated_at', lastSyncTime);

    if (error) throw error;
    if (!remoteRecords || remoteRecords.length === 0) return;

    await this.db.transaction('rw', this.db[this.tableName], async () => {
      for (const remote of remoteRecords) {
        const local = await this.db[this.tableName].get(remote.id);
        
        // Conflict resolution: Remote wins if local is synced or remote is newer
        const shouldUpdate = !local || 
                            local.sync_status === 'synced' || 
                            new Date(remote.updated_at) > new Date(local.updated_at);

        if (shouldUpdate) {
          if (remote.is_deleted) {
            await this.db[this.tableName].delete(remote.id);
          } else {
            await this.db[this.tableName].put({ ...remote, sync_status: 'synced' });
          }
        }
      }
    });
  }
}
