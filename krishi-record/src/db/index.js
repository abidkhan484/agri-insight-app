import Dexie from 'dexie';

export const db = new Dexie('KrishiRecordDB');

db.version(1).stores({
  plots: '++id, name, area, areaUnit',
  inputs: '++id, plotId, date, type, quantity, quantityUnit, cost',
  observations: '++id, plotId, date, title',
  harvests: '++id, plotId, date, crop, quantity, quantityUnit, revenue'
});

export default db;
