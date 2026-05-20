import Dexie from 'dexie';

export const db = new Dexie('KrishiRecordDB');

// Version 1: Initial local-only schema
db.version(1).stores({
  plots: '++id, name, area, areaUnit',
  inputs: '++id, plotId, date, type, quantity, quantityUnit, cost',
  observations: '++id, plotId, date, title',
  harvests: '++id, plotId, date, crop, quantity, quantityUnit, revenue'
});

// Version 2: Added sync metadata and UUID support for Supabase integration
db.version(2).stores({
  plots: 'id, name, area, areaUnit, sync_status, updated_at',
  inputs: 'id, plotId, date, type, sync_status, updated_at',
  observations: 'id, plotId, date, sync_status, updated_at',
  harvests: 'id, plotId, date, sync_status, updated_at'
}).upgrade(tx => {
  // Migration logic could go here if we wanted to convert existing INT ids to UUIDs,
  // but for a fresh project we can just use the new schema.
});

export default db;

/**
 * Helper to generate a UUID for offline-first primary keys.
 */
export function generateId() {
  return crypto.randomUUID();
}
